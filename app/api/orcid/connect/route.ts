import { NextResponse } from "next/server";
import {
  cookieOptions, getAppBaseUrl, randomToken, readSessionFromCookie,
  safeReturnTo, sealPayload, sessionCookieName,
} from "@/lib/auth0-native";
import { getMemberByAuth0Sub, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type OrcidTransaction={state:string;auth0Sub:string;returnTo:string;createdAt:number};
const transactionCookieName=()=>process.env.NODE_ENV==="production"?"__Host-tamv_orcid_tx":"tamv_orcid_tx";
function sessionFromRequest(request:Request){
 const cookie=request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(sessionCookieName()+"="))?.slice(sessionCookieName().length+1);
 return readSessionFromCookie(cookie);
}

export async function GET(request:Request){
 let baseUrl:string;
 try{baseUrl=getAppBaseUrl(request.url);}
 catch{return NextResponse.json({error:"Configura APP_BASE_URL HTTPS para enlazar ORCID."},{status:503,headers:{"cache-control":"no-store"}});}
 const clientId=process.env.ORCID_CLIENT_ID?.trim();
 const clientSecret=process.env.ORCID_CLIENT_SECRET?.trim();
 if(!clientId||!clientSecret) return NextResponse.redirect(new URL("/cuenta?orcid=unconfigured",baseUrl));
 const session=sessionFromRequest(request);
 if(!session||!session.email||!session.emailVerified) return NextResponse.redirect(new URL("/registro?error=orcid_link_requires_verified_account",baseUrl));
 try{
  const member=await getMemberByAuth0Sub(session.sub);
  if(!member) return NextResponse.redirect(new URL("/registro?error=orcid_link_requires_tamv_id",baseUrl));
  const state=randomToken(32);
  const incoming=new URL(request.url);
  const returnTo=safeReturnTo(incoming.searchParams.get("returnTo")||"/cuenta");
  const transaction:OrcidTransaction={state,auth0Sub:session.sub,returnTo,createdAt:Date.now()};
  const authorization=new URL("https://orcid.org/oauth/authorize");
  authorization.searchParams.set("client_id",clientId);
  authorization.searchParams.set("response_type","code");
  authorization.searchParams.set("scope","/authenticate");
  authorization.searchParams.set("redirect_uri",baseUrl+"/api/orcid/callback");
  authorization.searchParams.set("state",state);
  const response=NextResponse.redirect(authorization);
  response.cookies.set(transactionCookieName(),sealPayload(transaction),cookieOptions(600));
  response.headers.set("cache-control","no-store");
  return response;
 }catch(error){
  if(error instanceof SupabaseConfigurationError) return NextResponse.redirect(new URL("/cuenta?orcid=database_unconfigured",baseUrl));
  console.error("ORCID link initiation failed");
  return NextResponse.redirect(new URL("/cuenta?orcid=start_failed",baseUrl));
 }
}
