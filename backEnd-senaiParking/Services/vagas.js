import Garages from "../models/garage.js";

export const VAGAS_MAXIMAS = 10; 

export async function getVagasDisponiveis() {
  const entradasAtivas = await Garages.count({
    where: { tipo: "entrada", autorizado: true },
  });
  
  const saidasAtivas = await Garages.count({
    where: { tipo: "saida", autorizado: true },
  });

  return VAGAS_MAXIMAS - (entradasAtivas - saidasAtivas);
}