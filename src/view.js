export default class BaseView {
  svg = null;
  width = null;
  height = null;

  getData = () => [];

  constructor({ svg, width, height }) {
    this.svg = svg;
    this.width = width;
    this.height = height;
  }

  onResize({ width, height }) {
    this.width = width;
    this.height = height;
  }

  updateDataFunc(func) {
    this.getData = func;
  }

  init() {
    console.log("INIT", this.constructor.name, this.width, this.height);
  }

  render() {
    console.log("RENDER", this.constructor.name, this.getData());
  }
}
