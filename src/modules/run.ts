import shared from "../shared";
import { done, displayError } from "../utils";
import Entity from "./Entity";

export type RunAttributes = {
  isDestroy?: boolean;
  message?: string;
};

export const enum RunStatus {
  Pending = "pending",
  Planning = "planning",
  Planned = "planned",
  Applying = "applying",
  Applied = "applied",
  Canceled = "canceled"
}

export default class Run extends Entity {
  constructor(readonly id: string) {
    super();
  }

  static async create(
    workspaceID: string,
    attrs: RunAttributes,
    configurationVersion = ""
  ) {
    const { isDestroy, message } = attrs;

    const data = {
      attributes: { message },
      type: "runs",
      relationships: {
        workspace: {
          data: {
            type: "workspaces",
            id: workspaceID
          }
        }
      }
    };

    // Was getting occasional 422s when including is-destroy: false.
    // This seems to have fixed the problem.
    if (isDestroy) {
      data.attributes["is-destroy"] = true;
    }

    if (configurationVersion) {
      data.relationships["configuration-version"] = {
        data: {
          type: "configuration-versions",
          id: configurationVersion
        }
      };
    }

    const { id } = Run.performCreate("runs/", { data }, "Failed to create run");
    return new Run(id);
  }

  static async list(workspaceID: string) {
    const { data } = await shared.api.get(`workspaces/${workspaceID}/runs`);
    return data.data;
  }

  apply(comment: string = "") {
    return shared.api
      .post(`runs/${this.id}/actions/apply`, { comment })
      .catch(displayError);
  }

  // TODO: implement
  // discard(comment: string = undefined) {
  // }

  // TODO: implement
  // cancel(comment: string = undefined, force = false) {
  // }

  // TODO: implement
  // forceExecute(comment: string = undefined, force = false) {
  // }

  /**
   * Wait for a run to reach a specified status
   *
   * TODO: add configurable timeout
   *
   * TODO: bail out with error if run reaches a status that can never lead to the desired status (E.g. status = 'canceled', desired = 'planned')
   *
   * @returns a Promise which will resolve when the run achieves the desired status.
   */
  hasReachedStatus(desiredStatus: RunStatus) {
    return done(async () => {
      const { data: runUpdate } = await shared.api
        .get(`runs/${this.id}`)
        .catch(displayError);
      const { status } = runUpdate.data.attributes;
      return status === desiredStatus;
    });
  }
}
