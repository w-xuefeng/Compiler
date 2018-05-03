import Stack from './stack.js'
export default class Trans {
  constructor (input) {
    this.input = input
    this.theStack = new Stack(input.length)
    this.output = []
  }
  justDoIt () {
    for (let j = 0; j < this.input.length; j++) {
      let ch = this.input[j]
      switch (ch) {
        case '+':
        case '-':
          this.gotO(ch, 1)
          break
        case '*':
        case '/':
          this.gotO(ch, 2)
          break
        case '(':
          this.theStack.push(ch)
          break
        case ')':
          this.gotP()
          break
        default:
          this.output.push(ch)
          break
      }
    }
    while (!this.theStack.isEmpty()) {
      this.output.push(this.theStack.pop())
    }
    return this.output
  }
  gotO (opThis, prec1) {
    while (!this.theStack.isEmpty()) {
      let opTop = this.theStack.pop()
      if (opTop === '(') {
        this.theStack.push(opTop)
        break
      } else {
        let prec2 = (opTop === '+' || opTop === '-') ? 1 : 2
        if (prec2 < prec1) {
          this.theStack.push(opTop)
          break
        } else {
          this.output.push(opTop)
        }
      }
    }
    this.theStack.push(opThis)
  }
  gotP () {
    while (!this.theStack.isEmpty()) {
      let chx = this.theStack.pop()
      if (chx === '(') {
        break
      } else {
        this.output.push(chx)
      }
    }
  }
}
