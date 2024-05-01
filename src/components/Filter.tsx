/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// import Select from "react-select";
import { MultiSelect } from "react-multi-select-component";
import "rc-slider/assets/index.css";
import { occasionOptions } from "../../constant";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useQueryParams } from "@/hooks/useQueryParams";
const Select = dynamic(() => import("react-select"), { ssr: false });

const discountOptions = [
  { value: "", label: "None" },
  { value: "0-5", label: "From 0% to 5%" },
  { value: "6-10", label: "From 6% to 10%" },
  { value: "11-15", label: "From 11 to 15%" },
];

function Filter({ categories, brands }) {
  const searchParams = useQueryParams();
  const router = useRouter();
  const brandsOption: any[] = useMemo(() => {
    return brands.map((brand: any) => ({
      value: brand.id,
      label: brand.name,
    }));
  }, [brands]);

  const categoriesOption: any[] = useMemo(() => {
    return categories.map((category: any) => ({
      value: category.id,
      label: category.name,
    }));
  }, [categories]);

  const occasionOption: any[] = useMemo(() => {
    return occasionOptions.map((item) => {
      return {
        value: item,
        label: item,
      };
    });
  }, []);

  const [brandsSelected, setBrandsSelected] = useState(() => {
    if (searchParams.get("brandId")) {
      return searchParams
        .get("brandId")
        ?.split(",")
        .map((brandId) => {
          return {
            value: +brandId,
            label: brandsOption.find(
              (option) => option.value === +brandId
            ).label,
          };
        });
    } else {
      return [];
    }
  });

  const [categoriesSelected, setCategoriesSelected] = useState(() => {
    if (searchParams.get("categoryId")) {
      return searchParams
        .get("categoryId")
        ?.split(",")
        .map((categoryId) => {
          return {
            value: +categoryId,
            label: categoriesOption.find(
              (option) => option.value === +categoryId
            ).label,
          };
        });
    } else {
      return [];
    }
  });

  const [sliderValue, setSliderValue] = useState(
    () => searchParams.get("priceRangeTo") || 2000
  );

  const [sliderChanged, setSliderChanged] = useState(false);

  const [selectedGender, setSelectedGender] = useState(
    () => searchParams.get("gender") || ""
  );

  const [occasionsSelected, setOccasionsSelected] = useState(() => {
    if (searchParams.get("occasions")) {
      return searchParams
        .get("occasions")
        ?.split(",")
        .map((occasions) => {
          return {
            value: +occasions,
            label: occasionOption.find(
              (option) => option.value === +occasions
            ).label,
          };
        });
    } else {
      return [];
    }
  });

  const [discountValue, setDiscountValue] = useState(
    () => searchParams.get("discount")||discountOptions[0]
  );

  const initialDiscountOptions = useMemo(() => {
    if (searchParams.get("discount")) {
      const value = searchParams.get("discount");
      if (!value) return discountOptions[0];
      const [from, to] = value?.split("-");
      return { value, label: `From ${from}% to ${to}%` };
    } else {
      return discountOptions[0];
    }
  }, []);

  const initialBrandOptions = useMemo(() => {
    if (searchParams.get("brandId")) {
      return searchParams
        .get("brandId")
        ?.split(",")
        .map((brandId) => {
          return {
            value: +brandId,
            label: brandsOption.find((option) => option.value === +brandId)
              .label,
          };
        });
    } else {
      return [];
    }
  }, [brandsOption]);

  const initialOccasionOptions = useMemo(() => {
    if (searchParams.get("occasions")) {
      return searchParams
        .get("occasions")
        ?.split(",")
        .map((item) => ({ value: item, label: item }));
    } else {
      return [];
    }
  }, []);

  useEffect(() => {
    if (sliderChanged) {
      const handler = setTimeout(() => {
        searchParams.delete("page");
        searchParams.delete("pageSize");
        searchParams.set("priceRangeTo", `${sliderValue}`);
        router.push(`/products?${searchParams.toString()}`, { scroll: false });
        setSliderChanged(false);
      }, 300);

      return () => clearTimeout(handler);
    }
  }, [sliderValue]);
 
  function handleBrandsSelect(e) {
    searchParams.delete('brandId');
    e.forEach(brand => searchParams.append('brandId',brand.value));
    router.push('/products?'+searchParams.toString());
    setBrandsSelected(e);
  }

  function handleCategoriesSelected(e) {
    searchParams.delete('categoryId');
    e.forEach(category => searchParams.append('categoryId',category.value));
    router.push('/products?'+searchParams.toString());
    setCategoriesSelected(e);
  }

  function handleSlider(e) {
    searchParams.set('priceRangeTo',e.target.value);
    router.push('/products?'+searchParams.toString());
    setSliderValue(e.target.value);
    setSliderChanged(true);
  }

  const handleGenderChange = (e) => {
    searchParams.set('gender',e.target.value);
    router.push('/products?'+searchParams.toString());
    setSelectedGender(e.target.value);
  };

  function handleOccasions(e) {
    searchParams.delete('occasions');
    e.forEach(occasion => searchParams.append('occasions',occasion.value));
    router.push('/products?'+searchParams.toString());
    setOccasionsSelected(e);
  }

  function handleDiscount(e) {
    searchParams.set('discount',e.value);
    router.push('/products?'+searchParams.toString());
    setDiscountValue(e);
  }

  function handleClearAll() {
    searchParams.delete("brandId");
    searchParams.delete("categoryId");
    searchParams.delete("priceRangeTo");
    searchParams.delete("gender");
    searchParams.delete("occasions");
    searchParams.delete("discount");
    resetForm();
    router.push(`/products?${searchParams.toString()}`);
  }

  function resetForm(){
    setBrandsSelected([]);
    setCategoriesSelected([]);
    setSliderValue(2000);
    setSelectedGender("");
    setOccasionsSelected([]);
    setDiscountValue("");
  }
  return (
    <div className="w-full">
      <button className="bg-white p-2 my-4 text-black" onClick={handleClearAll}>
        Clear All
      </button>
      <p className="text-lg">Filter By</p>
      <div className="w-1/4 flex  items-center gap-4 mb-4">
        <span>Brands</span>
        <Select
          className="flex-1 text-black"
          options={brandsOption}
          isMulti
          name="brands"
          onChange={handleBrandsSelect}
          defaultValue={initialBrandOptions}
          value={brandsSelected as []}
        />
      </div>
      <div className="w-1/3 flex items-center gap-4 mb-4">
        <span>Categories</span>
        <MultiSelect
          className="text-black flex-1"
          options={categoriesOption}
          value={categoriesSelected as []}
          labelledBy="categories select"
          hasSelectAll={false}
          onChange={handleCategoriesSelected}
        />
      </div>
      <div>
        <span>Select products from Range 1 to 2000</span>
        <br />
        <span>Current Value {sliderValue}</span> <br />
        <input
          type="range"
          step="50"
          min="100"
          max="2000"
          value={sliderValue}
          onChange={handleSlider}
        />
      </div>
      <div>
        Select Gender: <br />
        <input
          type="radio"
          id="none"
          name="gender"
          value=""
          checked={selectedGender === ""}
          onChange={handleGenderChange}
        />
        <label htmlFor="none">None</label> <br />
        <input
          type="radio"
          id="men"
          name="gender"
          value="men"
          checked={selectedGender === "men"}
          onChange={handleGenderChange}
        />
        <label htmlFor="men">Men</label>
        <br />
        <input
          type="radio"
          id="women"
          name="gender"
          value="women"
          checked={selectedGender === "women"}
          onChange={handleGenderChange}
        />
        <label htmlFor="women">Women</label>
        <br />
        <input
          type="radio"
          id="boy"
          name="gender"
          value="boy"
          checked={selectedGender === "boy"}
          onChange={handleGenderChange}
        />
        <label htmlFor="boy">Boy</label>
        <br />
        <input
          type="radio"
          id="girl"
          name="gender"
          value="girl"
          checked={selectedGender === "girl"}
          onChange={handleGenderChange}
        />
        <label htmlFor="girl">Girl</label>
      </div>
      <div className="w-1/4 flex  items-center gap-4 mb-4">
        <span>Occasion</span>
        <Select
          className="flex-1 text-black"
          options={occasionOption}
          isMulti
          name="occasion"
          onChange={handleOccasions}
          value={occasionsSelected as []}
          defaultValue={initialOccasionOptions}
        />
      </div>

      <div className="w-1/4 flex  items-center gap-4 mb-4">
        <span>Filter By discount</span>
        <Select
          className="flex-1 text-black"
          options={discountOptions}
          name="discount"
          defaultValue={initialDiscountOptions}
          onChange={handleDiscount}
          value={discountValue}
        />
      </div>
    </div>
  );
}

export default Filter;
