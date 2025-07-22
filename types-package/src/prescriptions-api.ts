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

export interface Prescription {
  /** @example "PRESC-789" */
  id: string;
  /** @example "PAT-456" */
  patientId: string;
  /** @example "MED-123" */
  medicationId: string;
  /** @example "ACTIVE" */
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  /**
   * @format date
   * @example "2024-03-20"
   */
  prescribedDate: string;
  /** @example "1 tablet twice daily" */
  dosage?: string;
  /**
   * Duration in days
   * @example 7
   */
  duration?: number;
  /** @example "Take with food" */
  notes?: string;
  /** @example "DR-789" */
  prescribedBy?: string;
  /**
   * @format date-time
   * @example "2024-03-20T10:30:00Z"
   */
  lastUpdated?: string;
}

export namespace Prescriptions {
  /**
   * No description
   * @name ListPrescriptions
   * @summary List all prescriptions
   * @request GET:/prescriptions
   * @response `200` `(Prescription)[]` A list of prescriptions
   */
  export namespace ListPrescriptions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Prescription[];
  }
  /**
   * No description
   * @name CreatePrescription
   * @summary Create a new prescription
   * @request POST:/prescriptions
   * @response `201` `Prescription` Prescription created successfully
   */
  export namespace CreatePrescription {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = Prescription;
    export type RequestHeaders = {};
    export type ResponseBody = Prescription;
  }
  /**
   * No description
   * @name GetPrescriptionById
   * @summary Get prescription by ID
   * @request GET:/prescriptions/{id}
   * @response `200` `Prescription` Prescription details
   */
  export namespace GetPrescriptionById {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Prescription;
  } /**
 * No description
 * @name PingPrescriptions
 * @summary Ping endpoint for pipeline testing
 * @request GET:/prescriptions/ping
 * @response `200` `{
  \** @example "Prescriptions API is up and running!" *\
    message?: string,

}` Ping successful
*/
  export namespace PingPrescriptions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      /** @example "Prescriptions API is up and running!" */
      message?: string;
    };
  }
}
