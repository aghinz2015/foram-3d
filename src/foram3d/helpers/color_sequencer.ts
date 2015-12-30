module Foram3D.Helpers {
  export class ColorSequencer {
    colors: Array<number>;
    currentColorIndex: number;

    static COLORS: Array<number> = [
      0xff0000,
      0x00ff00,
      0x0000ff
    ];

    constructor(colors?: Array<number>) {
      this.colors = colors || ColorSequencer.COLORS;
      this.currentColorIndex = 0;
    }

    next(): number {
      var color = this.colors[this.currentColorIndex];

      this.currentColorIndex += 1;
      this.currentColorIndex %= this.colors.length;

      return color;
    }

    reset() {
      this.currentColorIndex = 0;
    }
  }
}
