// Ponto único de escolha da implementação de dados.
// Hoje: repositório simulado. Futuro: implementação Supabase com o mesmo contrato.
import { createMockRepository } from "./mock/mock-repository";
import type { Repository } from "./repository";

export const IS_DEMO_DATA = true;

let instance: Repository | null = null;
export const getRepository = (): Repository => (instance ??= createMockRepository());

export type { Repository, DataSnapshot, NewTaskInput } from "./repository";
