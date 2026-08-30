import { requisitar } from "./api";
import type { Dashboard } from "@/types";

export const obterDashboard = (token: string): Promise<Dashboard> =>
  requisitar<Dashboard>("/admin/dashboard", { token });
