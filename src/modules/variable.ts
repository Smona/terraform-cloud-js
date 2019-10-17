import { kebabize } from "../utils"
import Entity from "./Entity"

// TODO: differtiate optionality between arguments and responses
/** You can view attribute defaults and descriptions at the [TF Cloud Workspace API docs](https://www.terraform.io/docs/cloud/api/variables.html#request-body) */
export type VariableAttributes = {
  key: string,
  value?: string,
  category: VariableCategory,
  hcl?: boolean,
  sensitive?: boolean,
}

export type Relationship = {
  data: {
    id: string,
    type: string,
  }
}

export type VariableData = {
  id: string,
  attributes: VariableAttributes,
  relationships: {
    configurable: Relationship,
  },
  links: {
    self: string,
  }
}

export const enum VariableCategory {
  Terraform = 'terraform',
  Env = 'env',
}

export default class Variable extends Entity {
  constructor(readonly id: string) { 
    super()
  }

  static async create(workspaceID: string, attrs: VariableAttributes) {
    console.log(`Creating variable ${attrs.key}`)

    const { id } = await this.performCreate<VariableData>('vars/', {
      data: {
        type: 'vars',
        attributes: kebabize(attrs),
        relationships: {
          workspace: {
            data: {
              id: workspaceID,
              type: 'workspaces',
            },
          },
        },
      },
    }, `Failed to create variable ${attrs.key}`)

    return new Variable(id)
  }

  static async delete(variableID: string) {
    return this.performDelete(`vars/${variableID}`, `Failed to delete variable ${variableID}`)
      .then(() => console.log(`Successfully deleted variable ${variableID}`))
  }

  async delete() {
    return Variable.delete(this.id)
  }
}