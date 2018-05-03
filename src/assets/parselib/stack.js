export default class Stack {
  constructor (szie) {
    this.stackArray = new Array(szie)
    this.top = -1
  }
  push (j) {
    this.stackArray[++this.top] = j
  }
  pop () {
    return this.stackArray[this.top--]
  }
  peek () {
    return this.stackArray[this.top]
  }
  isEmpty () {
    return (this.top === -1)
  }
}
