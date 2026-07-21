import { graphql } from "../lib/shopify.server";

/**
 * Shop Information
 */
export async function getShop(admin) {
  const data = await graphql(
    admin,
    `#graphql
    query {

      shop {

        id
        name
        email
        myshopifyDomain
        primaryDomain{
          url
        }

      }

    }
    `
  );

  return data.shop;
}

/**
 * Products
 */
export async function getProducts(admin, first = 50) {
  const data = await graphql(
    admin,
    `#graphql
    query Products($first:Int!) {

      products(first:$first){

        nodes{

          id
          title
          handle

          featuredImage{
            url
          }

          totalInventory

        }

      }

    }
    `,
    {
      first,
    }
  );

  return data.products.nodes;
}

/**
 * Product
 */
export async function getProduct(admin, id) {
  const data = await graphql(
    admin,
    `#graphql
    query Product($id:ID!){

      product(id:$id){

        id
        title
        handle
        totalInventory

        featuredImage{
          url
        }

      }

    }
    `,
    {
      id,
    }
  );

  return data.product;
}

/**
 * Collections
 */
export async function getCollections(admin) {
  const data = await graphql(
    admin,
    `#graphql
    query{

      collections(first:100){

        nodes{

          id
          title

        }

      }

    }
    `
  );

  return data.collections.nodes;
}

/**
 * Orders
 */
export async function getOrders(admin, first = 20) {
  const data = await graphql(
    admin,
    `#graphql
    query Orders($first:Int!){

      orders(first:$first){

        nodes{

          id
          name
          createdAt

          totalPriceSet{

            shopMoney{

              amount
              currencyCode

            }

          }

        }

      }

    }
    `,
    {
      first,
    }
  );

  return data.orders.nodes;
}