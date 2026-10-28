export type MembershipProduct = {
  id: string
  name: string
  priceInCents: number
  description: string
  access: string[]
  emphasis?: string
}

export const MEMBERSHIPS: MembershipProduct[] = [
  { id: 'premium', name: 'Premium', priceInCents: 20000, description: 'Para profesionales independientes que desean identidad, portafolio y participación ampliada.', access: ['Perfil y TAMV ID', 'Portafolio trazable', 'Convocatorias abiertas', 'Recursos premium'] },
  { id: 'academico', name: 'Académico', priceInCents: 34900, description: 'Para docentes, estudiantes de posgrado e investigadores con actividad documentada.', access: ['Todo Premium', 'Perfil académico', 'Proyectos y grupos de investigación', 'Revisión metodológica prioritaria'], emphasis: 'Más elegido' },
  { id: 'empresarial', name: 'Empresarial', priceInCents: 90000, description: 'Para empresas y organizaciones que requieren presencia institucional y colaboración estructurada.', access: ['Todo Académico', 'Perfil de organización', 'Directorio empresarial', 'Mesa de colaboración'] },
  { id: 'donante', name: 'Donante', priceInCents: 5000, description: 'Apoyo mensual mínimo para sostener infraestructura, documentación y ciencia abierta.', access: ['Reconocimiento voluntario', 'Informe de impacto', 'Acceso a encuentros de comunidad'] },
]

export function getMembership(id: string) {
  return MEMBERSHIPS.find((membership) => membership.id === id)
}
