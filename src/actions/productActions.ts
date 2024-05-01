//@ts-nocheck
"use server";

import { sql } from "kysely";
import { DEFAULT_PAGE_SIZE } from "../../constant";
import { db } from "../../db";
import { InsertProducts, UpdateProducts } from "@/types";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/utils/authOptions";
import { cache } from "react";

export async function saveProducts(product:InsertProducts, categories){
  const productEntity = await db.insertInto('products').values(product).executeTakeFirst();
  await db.insertInto('product_categories').values(categories.map((category)=>({
    product_id:productEntity.insertId,
    category_id:category.value
  }))).execute();
};

export async function updateProduct(product:UpdateProducts, categories){
  const productEntity = await db.updateTable('products').set(product).where('id','=',product.id).executeTakeFirst();
  const productCategories = await db.selectFrom('product_categories').selectAll().where('product_id','=',product.id).execute();
  const categoryIds = productCategories.map((productCategory) =>productCategory.category_id);
  const notExistingCategories = categories.filter((category)=>{
    if(categoryIds.find(id=>id==category.value)){
      return false;
    };
    return true;
  });
  const removedCategoryIds =  categoryIds.filter((id)=>{
    if(categories.find(category=>id==category.value)){
      return false;
    };
    return true;
  });
  if(removedCategoryIds.length){
    await db.deleteFrom('product_categories').where('product_id','=',product.id).where('category_id','in',removedCategoryIds).execute();
  }
  if(notExistingCategories.length){
    await db.insertInto('product_categories').values(notExistingCategories.map((category)=>({
      product_id:product.id,
      category_id:category.value
    }))).execute();
  }
};

export async function getProducts(sortBy, pageNo = 1, pageSize = DEFAULT_PAGE_SIZE, filter={}) {
  try {
    let products;
    let dbQuery=db.selectFrom("products");
    const {brandId, categoryId, priceRangeTo, gender, occasions, discount}=filter;
    if(brandId){
      const brandIds = (Array.isArray(brandId))?brandId:[brandId];
      dbQuery= dbQuery.where('brands','regexp',`\\b(${brandIds.join('|')})\\b`);
    }
    if(categoryId){
      const categoryIds = (Array.isArray(categoryId))?categoryId:[categoryId];
      dbQuery = dbQuery.innerJoin('product_categories','product_id', 'products.id').where('category_id','in',categoryIds)
    }
    if(sortBy){
      const [field, order] = sortBy?.split('-');
      dbQuery= dbQuery.orderBy(`products.${field}`, order);
    }
    if(priceRangeTo){
      dbQuery= dbQuery.where('price','<=',priceRangeTo);
    }
    if(gender){
      dbQuery= dbQuery.where('gender','=',gender);
    }
    if(occasions){
      const occasionList = (Array.isArray(occasions))?occasions:[occasions];
      dbQuery= dbQuery.where('occasion','regexp',`\\b(${occasionList.join('|')})\\b`);
    }
    if(discount){
      dbQuery= dbQuery.where('discount','>=',discount.split('-')[0]).where('discount','<=',discount.split('-')[1]);
    }

    const { count } = await dbQuery
      .select(sql`COUNT(products.id) as count`)      
      .executeTakeFirst();
    const lastPage = Math.ceil(count / pageSize);
    
    products = await dbQuery
      .selectAll('products')
      .distinct()
      .offset((pageNo - 1) * pageSize)
      .limit(pageSize)
      .execute();



    const numOfResultsOnCurPage = products.length;

    return { products, count, lastPage , numOfResultsOnCurPage };
  } catch (error) {
    throw error;
  }
}

export const getProduct = cache(async function getProduct(productId: number) {
  // console.log("run");
  try {
    const product = await db
      .selectFrom("products")
      .selectAll()
      .where("id", "=", productId)
      .execute();

    return product;
  } catch (error) {
    return { error: "Could not find the product" };
  }
});

async function enableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 1`.execute(db);
}

async function disableForeignKeyChecks() {
  await sql`SET foreign_key_checks = 0`.execute(db);
}

export async function deleteProduct(productId: number) {
  try {
    await disableForeignKeyChecks();
    await db
      .deleteFrom("product_categories")
      .where("product_categories.product_id", "=", productId)
      .execute();
    await db
      .deleteFrom("reviews")
      .where("reviews.product_id", "=", productId)
      .execute();

    await db
      .deleteFrom("comments")
      .where("comments.product_id", "=", productId)
      .execute();

    await db.deleteFrom("products").where("id", "=", productId).execute();

    await enableForeignKeyChecks();
    revalidatePath("/products");
    return { message: "success" };
  } catch (error) {
    return { error: "Something went wrong, Cannot delete the product" };
  }
}

export async function MapBrandIdsToName(brandsId) {
  const brandsMap = new Map();
  try {
    for (let i = 0; i < brandsId.length; i++) {
      const brandId = brandsId.at(i);
      const brand = await db
        .selectFrom("brands")
        .select("name")
        .where("id", "=", +brandId)
        .executeTakeFirst();
      brandsMap.set(brandId, brand?.name);
    }
    return brandsMap;
  } catch (error) {
    throw error;
  }
}

export async function getAllProductCategories(products: any) {
  try {
    const productsId = products.map((product) => product.id);
    const categoriesMap = new Map();

    for (let i = 0; i < productsId.length; i++) {
      const productId = productsId.at(i);
      const categories = await db
        .selectFrom("product_categories")
        .innerJoin(
          "categories",
          "categories.id",
          "product_categories.category_id"
        )
        .select("categories.name")
        .where("product_categories.product_id", "=", productId)
        .execute();
      categoriesMap.set(productId, categories);
    }
    return categoriesMap;
  } catch (error) {
    throw error;
  }
}

export async function getProductCategories(productId: number) {
  try {
    const categories = await db
      .selectFrom("product_categories")
      .innerJoin(
        "categories",
        "categories.id",
        "product_categories.category_id"
      )
      .select(["categories.id", "categories.name"])
      .where("product_categories.product_id", "=", productId)
      .execute();

    return categories;
  } catch (error) {
    throw error;
  }
}
