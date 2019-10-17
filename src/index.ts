import { Workspace, Variable, Run } from "./modules";
import shared from "./shared";

export default function configure(token: string) {
  shared.token = token;
  return {
    Workspace,
    Variable,
    Run
  };
}
