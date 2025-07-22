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

export interface Product {
  /** @example "MED-123" */
  id: string;
  /** @example "Paracetamol 500mg" */
  name: string;
  /** @example "MEDICATION" */
  category: "MEDICATION" | "DEVICE" | "SUPPLY";
  /** @example "AVAILABLE" */
  status: "AVAILABLE" | "OUT_OF_STOCK" | "DISCONTINUED";
  /** @example "Pain relief medication" */
  description?: string;
  /** @example "PharmaCorp Ltd" */
  manufacturer?: string;
  /**
   * @format date
   * @example "2025-12-31"
   */
  expiryDate?: string;
}

export namespace Products {
  /**
   * No description
   * @name ListProducts
   * @summary List all products
   * @request GET:/products
   * @response `200` `(Product)[]` A list of products
   */
  export namespace ListProducts {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Product[];
  }
  /**
   * No description
   * @name CreateProduct
   * @summary Create a new product
   * @request POST:/products
   * @response `201` `Product` Product created successfully
   */
  export namespace CreateProduct {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = Product;
    export type RequestHeaders = {};
    export type ResponseBody = Product;
  }
  /**
   * No description
   * @name GetProductById
   * @summary Get product by ID
   * @request GET:/products/{id}
   * @response `200` `Product` Product details
   */
  export namespace GetProductById {
    export type RequestParams = {
      id: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = Product;
  }
}
