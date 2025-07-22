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

export interface Car {
  /** @example "car-123" */
  id: string;
  /** @example "Toyota" */
  make: string;
  /** @example "Camry" */
  model: string;
  /** @example 2023 */
  year: number;
  /** @example "Silver" */
  color?: string;
  /**
   * @format float
   * @example 25000
   */
  price?: number;
  /** @example ["Bluetooth","Navigation","Sunroof"] */
  features?: string[];
  specifications?: {
    /** @example "2.5L 4-cylinder" */
    engine?: string;
    /** @example "Automatic" */
    transmission?: string;
    /** @example "Gasoline" */
    fuelType?: string;
    /**
     * @format float
     * @example 30.5
     */
    mileage?: number;
  };
}

export interface CarCreate {
  /** @example "Toyota" */
  make: string;
  /** @example "Camry" */
  model: string;
  /** @example 2023 */
  year: number;
  /** @example "Silver" */
  color?: string;
  /**
   * @format float
   * @example 25000
   */
  price?: number;
  /** @example ["Bluetooth","Navigation","Sunroof"] */
  features?: string[];
  specifications?: {
    /** @example "2.5L 4-cylinder" */
    engine?: string;
    /** @example "Automatic" */
    transmission?: string;
    /** @example "Gasoline" */
    fuelType?: string;
    /**
     * @format float
     * @example 30.5
     */
    mileage?: number;
  };
}

export interface CarUpdate {
  /** @example "Toyota" */
  make?: string;
  /** @example "Camry" */
  model?: string;
  /** @example 2023 */
  year?: number;
  /** @example "Silver" */
  color?: string;
  /**
   * @format float
   * @example 25000
   */
  price?: number;
  /** @example ["Bluetooth","Navigation","Sunroof"] */
  features?: string[];
  specifications?: {
    /** @example "2.5L 4-cylinder" */
    engine?: string;
    /** @example "Automatic" */
    transmission?: string;
    /** @example "Gasoline" */
    fuelType?: string;
    /**
     * @format float
     * @example 30.5
     */
    mileage?: number;
  };
}

export interface Error {
  /** @example "NOT_FOUND" */
  code: string;
  /** @example "Car not found" */
  message: string;
}

export interface ListCarsParams {
  /** Filter cars by make */
  make?: string;
  /** Filter cars by model */
  model?: string;
}

export namespace Cars {
  /**
 * No description
 * @name ListCars
 * @summary List all cars
 * @request GET:/cars
 * @response `200` `{
    items?: (Car)[],
  \** @example 10 *\
    totalCount?: number,

}` A list of cars
*/
  export namespace ListCars {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Filter cars by make */
      make?: string;
      /** Filter cars by model */
      model?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = {
      items?: Car[];
      /** @example 10 */
      totalCount?: number;
    };
  }
  /**
   * No description
   * @name CreateCar
   * @summary Create a new car
   * @request POST:/cars
   * @response `201` `Car` Car created successfully
   */
  export namespace CreateCar {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CarCreate;
    export type RequestHeaders = {};
    export type ResponseBody = Car;
  }
  /**
   * No description
   * @name GetCarById
   * @summary Get a car by ID
   * @request GET:/cars/{id}
   * @response `200` `Car` Car details
   * @response `404` `Error` Car not found
   */
  export namespace GetCarById {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Car;
  }
  /**
   * No description
   * @name UpdateCar
   * @summary Update a car
   * @request PUT:/cars/{id}
   * @response `200` `Car` Car updated successfully
   * @response `404` `Error` Car not found
   */
  export namespace UpdateCar {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = CarUpdate;
    export type RequestHeaders = {};
    export type ResponseBody = Car;
  }
  /**
   * No description
   * @name DeleteCar
   * @summary Delete a car
   * @request DELETE:/cars/{id}
   * @response `204` `void` Car deleted successfully
   * @response `404` `Error` Car not found
   */
  export namespace DeleteCar {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = void;
  }
}
