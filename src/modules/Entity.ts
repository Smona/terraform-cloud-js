import shared from "../shared";
import { displayError, camelize } from "../utils";

export default class Entity {
  protected static async performCreate<T>(
    url: string,
    payload: object,
    failureMessage = ""
  ) {
    const response = await shared.api.post(url, payload).catch(displayError);
    if (response) {
      return camelize(response.data.data) as T;
    } else {
      throw new Error(failureMessage);
    }
  }

  protected static async performDelete(url: string, failureMessage = "") {
    await shared.api.delete(url).catch(e => {
      displayError(e);
      throw new Error(failureMessage);
    });
    return null;
  }
}
