import { NextResponse } from "next/server";
import {
  cookieOptions, getAppBaseUrl, openPayload, readSessionFromCookie,
  safeReturnTo, secureEquals, sessionCookieName,
} from "@/lib/auth0-native";
import { getMemberByAuth0Sub, linkVerifiedOrcidIdentity, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type OrcidTransaction={state:string;auth0Sub:string;returnTo:string;createdAt:number};
type OrcidTokenResponse={orcid?:string;name?:string;access_token?:string;token_type?:string;scope?:string;expires_in?:number};
const transactionCookieName=()=>process.env.NODE_ENV==="production"?"__Host-tamv_orcid_tx":"tamv_orcid_tx";

function sessionFromRequest(request:Request){
 const cookie=request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(sessionCookieName()+"="))?.slice(sessionCookieName().length+1);
 return readSessionFromCookie(cookie);
}
function canonicalOrcid(value:string):string|null{
 const raw=value.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i,"").replace(/[\s-]/g,"").toUpperCase();
 if(!/^\d{15}[\dX]$/.test(raw))return null;
 let total=0;
 for(const digit of raw.slice(0,15))total=(total+Number(digit))*2;
 const result=(12-(total%11))%11;
 const check=result===10?"X":String(result);
 if(check!==raw[15])return null;
 return "https://orcid.org/"+raw.slice(0,4)+"-"+raw.slice(4,8)+"-"+raw.slice(8,12)+"-"+raw.slice(12);
}
function addStatus(baseUrl:string,returnTo:string,status:string){
 const destination=new URL(safeReturnTo(returnTo),baseUrl);
 destination.searchParams.set("orcid",status);
 return destination;
}
function clearTransaction(response:NextResponse){
 response.cookies.set(transactionCookieName(),"",{...cookieOptions(0),expires:new Date(0)});
 response.headers.set("cache-control","no-store");
 return response;
}

export async function GET(request:Request){
 let baseUrl:string;
 try{baseUrl=getAppBaseUrl(request.url);}
 catch{return NextResponse.json({error:"ORCID callback requires the configured HTTPS application base URL."},{status:503,headers:{"cache-control":"no-store"}});}
 const url=new URL(request.url);
 const redirectFailure=(status:string,returnTo="/cuenta")=>clearTransaction(NextResponse.redirect(addStatus(baseUrl,returnTo,status)));
 if(url.searchParams.has("error")) return redirectFailure(url.searchParams.get("error")==="access_denied"?"cancelled":"authorization_failed");
 const code=url.searchParams.get("code");
 const state=url.searchParams.get("state");
 const encrypted=request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(transactionCookieName()+"="))?.slice(transactionCookieName().length+1);
 const transaction=openPayload<OrcidTransaction>(encrypted);
 if(!code||!state||!transaction||Date.now()-transaction.createdAt>10*60*1000||Date.now()<transaction.createdAt||!secureEquals(state,transaction.state)){
  return redirectFailure("state_failed");
 }
 const session=sessionFromRequest(request);
 if(!session||!session.emailVerified||session.sub!==transaction.auth0Sub){
  return redirectFailure("session_changed",transaction.returnTo);
 }
 const clientId=process.env.ORCID_CLIENT_ID?.trim();
 const clientSecret=process.env.ORCID_CLIENT_SECRET?.trim();
 if(!clientId||!clientSecret)return redirectFailure("unconfigured",transaction.returnTo);
 try{
  const tokenResponse=await fetch("https://orcid.org/oauth/token",{
   method:"POST",headers:{"content-type":"application/x-www-form-urlencoded",accept:"application/json"},
   body:new URLSearchParams({
    client_id:clientId,client_secret:clientSecret,grant_type:"authorization_code",code,
    redirect_uri:baseUrl+"/api/orcid/callback",
   }),
   cache:"no-store",signal:AbortSignal.timeout(10000),
  });
  if(!tokenResponse.ok)return redirectFailure("exchange_failed",transaction.returnTo);
  const token=await tokenResponse.json() as OrcidTokenResponse;
  // The access token is used only as part of the OAuth exchange response and is not persisted.
  const orcid=canonicalOrcid(token.orcid||"");
  if(!orcid)return redirectFailure("invalid_identity",transaction.returnTo);
  const member=await getMemberByAuth0Sub(session.sub);
  if(!member)return redirectFailure("requires_tamv_id",transaction.returnTo);
  await linkVerifiedOrcidIdentity(session.sub,orcid);
  return clearTransaction(NextResponse.redirect(addStatus(baseUrl,transaction.returnTo,"connected")));
 }catch(error){
  if(error instanceof SupabaseConfigurationError)return redirectFailure("database_unconfigured",transaction.returnTo);
  console.error("ORCID OAuth callback failed");
  return redirectFailure("link_failed",transaction.returnTo);
 }
}
