export const roundPrice = (price: number) => {
    const remainder = price % 100;
    if (remainder > 0 && remainder <= 49) {
      return price - remainder + 50;
    } else if (remainder >= 50) {
      return price - remainder + 100;
    }
    return price;
  };