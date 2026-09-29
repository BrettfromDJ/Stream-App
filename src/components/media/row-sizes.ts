/** Fixed item widths so rows look identical whether loading or loaded. */
export const ROW_ITEM = {
  poster: "w-[32vw] min-[430px]:w-[29vw] sm:w-[22vw] md:w-[168px] lg:w-[176px] xl:w-[188px]",
  wide: "w-[82vw] sm:w-[60vw] md:w-[46vw] lg:w-[400px] xl:w-[420px]",
  // Number + poster: the poster keeps roughly the same width as a normal row.
  ranked: "w-[46vw] min-[430px]:w-[42vw] sm:w-[32vw] md:w-[250px] lg:w-[262px] xl:w-[282px]",
};

export const ROW_SIZES = {
  poster: "(min-width: 1280px) 188px, (min-width: 768px) 176px, (min-width: 640px) 22vw, 32vw",
  ranked: "(min-width: 1280px) 180px, (min-width: 768px) 168px, (min-width: 640px) 21vw, 30vw",
};
