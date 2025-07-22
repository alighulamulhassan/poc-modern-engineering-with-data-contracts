/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Patient {
  /** @example "Patient" */
  resourceType: string;
  /** @example 12345 */
  id: string;
  name?: {
    /** @example "Smith" */
    family?: string;
    /** @example ["John"] */
    given?: string[];
  }[];
  /** @example "male" */
  gender?: string;
  /**
   * @format date
   * @example "1980-01-02T00:00:00.000Z"
   */
  birthDate?: string;
}

export namespace Patient {
  /**
 * No description
 * @name ListPatients
 * @summary Get a list of patients
 * @request GET:/Patient
 * @response `200` `{
  \** @example "Bundle" *\
    resourceType?: string,
    entry?: (Patient)[],

}` A list of patients
*/
  export namespace ListPatients {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "Bundle" */
      resourceType?: string;
      entry?: Patient[];
    };
  }
  /**
   * No description
   * @name GetPatientById
   * @summary Get a patient by ID
   * @request GET:/Patient/{id}
   * @response `200` `Patient` Patient resource
   */
  export namespace GetPatientById {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Patient;
  }
}
