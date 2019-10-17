import shared from "../shared";
import { displayError, kebabize, camelize } from "../utils";
import Run, { RunAttributes, RunStatus } from "./run";
import Variable, { VariableAttributes } from "./variable";
import Entity from "./Entity";

/** You can view attribute defaults and descriptions at the [TF Cloud Workspace API docs](https://www.terraform.io/docs/cloud/api/workspaces.html#request-body) */
type WorkspaceAttributes = {
  name: string;
  autoApply?: boolean;
  description?: string;
  fileTriggersEnabled?: boolean;
  sourceName?: string;
  sourceURL?: string;
  queueAllRuns?: boolean;
  speculativeEnabled?: boolean;
  terraformVersion?: string;
  triggerPrefixes?: Array<string>;
  workingDirectory?: string;
  vcsRepo?: {
    oauthTokenID: string;
    branch?: string;
    ingressSubmodules?: string;
    identifier: string;
  };
};

export default class Workspace extends Entity {
  attributes: Promise<WorkspaceAttributes>;
  constructor(readonly id: string) {
    super();
    this.attributes = new Promise(async res => {
      const response = await shared.api
        .get(`workspaces/${id}`)
        .catch(displayError);
      if (response) {
        const { attributes } = response.data.data;
        res(camelize(attributes) as WorkspaceAttributes);
      }
    });
  }

  /**
   * Create a new TF Cloud Workspace
   *
   * @param orgName The name of the organization the workspace will be created within.
   * @param attrs Attributes used to configure the workspace. The full attribute reference can be found in the [TF Cloud docs](https://www.terraform.io/docs/cloud/api/workspaces.html#request-body)
   */
  static async create(orgName: string, attributes: WorkspaceAttributes) {
    const { id } = super.performCreate(`organizations/${orgName}/workspaces`, {
      data: {
        attributes: kebabize(attributes),
        type: "workspaces"
      }
    });

    return new Workspace(id);
  }

  static async get(orgName: string, name: string) {
    const response = await shared.api
      .get(`organizations/${orgName}/workspaces/${name}`)
      .catch(displayError);
    if (response) {
      return new Workspace(response.data.data.id);
    }
    throw new Error(
      `Failed to fetch workspace "${name}" in organization "${orgName}"`
    );
  }

  static async list() {}

  async destroy() {
    console.log("Destroying workspace resources...");

    const run = await this.createRun({
      message: "Automation-triggered destroy",
      isDestroy: true
    });

    console.log("Planning...");
    await run.hasReachedStatus(RunStatus.Planned);

    console.log("Applying...");
    await run.apply("applied automatically");
    await run.hasReachedStatus(RunStatus.Applied);

    console.log(`Destroyed successfully.`);
  }

  addVariable(attributes: VariableAttributes) {
    Variable.create(this.id, attributes);
  }

  addVariables(...argObjects: VariableAttributes[]) {
    return Promise.all(argObjects.map(this.addVariable.bind(this)));
  }

  createRun(attributes: RunAttributes, configurationVersion: string = "") {
    return Run.create(this.id, attributes, configurationVersion);
  }

  async delete() {
    const { name } = await this.attributes;
    console.log(`Deleting workspace ${name}...`);
    await this.destroy();
    return Workspace.performDelete(
      `workspaces/${this.id}`,
      "Successfully deleted workspace"
    );
  }
}
