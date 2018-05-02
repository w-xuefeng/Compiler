/*
*
* @ className： Paese 语法分析器 求文法的first集和follow集 构建预测文法分析表 并分析所传字符串
* @ param： tokenString String类型 词法分析返回的所有token连接形成的字符串
* @ param : grammer Array类型 文法规则 grammer = [{left: ['X'],right: ['Y', 'Z', ';']},...]
***/

/*
First集 和 Follow集 的存储结构

数据结构如下示例：

[
  {
    ntor: 'S', //非终结符
    First: // 该非终结符的 First 集 数组类型
      [
        {
          first: id ,// 终结符
          fromP: // 该终结符所来自的产生式 Object类型
            {
              left: 'S' ,// 该产生式的左边
              right: 'id' // 该产生式的右边
            }
        }
      ],
      FirstArray: [], // First集 集合形式
      Follow: [], //  Follow集 集合形式
  }
]

预测文法分析表 的存储结构

PreParseTable = {
  tor: [], // 终结符集和
  ntor: [], // 非终结符集和
  product: [ // 产生式 二维数组
    [{ // 第 i 个终结符第 j 个非终结符所对应的产生式，若无对应的产生式则为 x,表示 error
      left:, // 该产生式的左边
      right: // 该产生式的右边
    }]
  ]
}

分析结果  存储结构

{
  status: true,  // 分析结果状态 成功为true，失败或出错为fasle
  output: [{     // 分析成功输出的产生式结果集
    left:,       // 产生式左边
    right:       // 产生式右边
  },…],
  errorType: 0,  // 错误类型
  error: [{
    token: errorToken, // 出错 token
    value: errorValue  // 出错 token 的属性值
  },...]
}

*/

export default class Parse {
  constructor (tokenArray, tokenValue, grammer) {
    this.tokenArray = tokenArray
    this.grammer = grammer
    this.tokenValue = tokenValue
    this.setNonterminator()
    this.setTerminator()
  }
  get getTokenArray () {
    return this.tokenArray
  }
  set setTokenArray (tokenArray) {
    this.tokenArray = tokenArray
  }

  get getTokenValue () {
    return this.tokenValue
  }
  set setTokenValue (tokenValue) {
    this.tokenValue = tokenValue
  }

  get getGrammer () {
    return this.grammer
  }
  set setGrammar (grammer) {
    this.grammer = grammer
  }
  getSet () {
    let l = this.nonTerminator.length
    for (let i = 0; i < l; i++) {
      this.getFirst(i, this.nonTerminator[i])
    }
    for (let i = 0; i < l; i++) {
      this.getFollowSet()
    }
    let tempList = this.preParseList(this.NT)
    this.PPT = {
      tor: this.terminator,
      ntor: this.nonTerminator,
      product: []
    }
    const row = this.nonTerminator.length
    const col = this.terminator.length
    for (let i = 0; i < row; i++) {
      this.PPT.product[i] = []
      for (let j = 0; j < col; j++) {
        for (let k = 0; k < tempList.length; k++) {
          if (tempList[k].ntor === this.nonTerminator[i] && tempList[k].tor === this.terminator[j]) {
            this.PPT.product[i][j] = tempList[k].product
          }
        }
      }
    }
    for (let i = 0; i < row; i++) {
      for (let j = 0; j < col; j++) {
        if (!this.PPT.product[i][j]) {
          this.PPT.product[i][j] = 'x'
        }
      }
    }
  }
  getFirst (num, nt) {
    let l = this.grammer.length
    this.NT[num] = {
      ntor: nt,
      First: [],
      FirstArray: [],
      Follow: []
    }
    for (let i = 0; i < l; i++) {
      if (nt === this.grammer[i].left[0]) {
        if ((!this.inArray(this.grammer[i].right[0], this.nonTerminator)) && (!this.inArray(this.grammer[i].right[0], this.NT[num].FirstArray))) {
          let pointer = 1
          let curRules = [this.grammer[i].right[0]]
          while (this.grammer[i].right[pointer] && this.grammer[i].right[pointer] !== '|') {
            curRules.push(this.grammer[i].right[pointer])
            pointer++
          }
          this.NT[num].FirstArray.push(this.grammer[i].right[0])
          this.NT[num].First.push({
            first: this.grammer[i].right[0],
            fromP: {
              left: this.grammer[i].left[0],
              right: curRules
            }
          })
        }
        for (let j = 0; j < this.grammer[i].right.length; j++) {
          if ((this.grammer[i].right[j] === '|') && (!this.inArray(this.grammer[i].right[j + 1], this.nonTerminator)) && (!this.inArray(this.grammer[i].right[j + 1], this.NT[num].FirstArray))) {
            let pointer = 2
            let curRules = [this.grammer[i].right[j + 1]]
            while (this.grammer[i].right[j + pointer] && this.grammer[i].right[j + pointer] !== '|') {
              curRules.push(this.grammer[i].right[j + pointer])
              pointer++
            }
            this.NT[num].FirstArray.push(this.grammer[i].right[j + 1])
            this.NT[num].First.push({
              first: this.grammer[i].right[j + 1],
              fromP: {
                left: this.grammer[i].left[0],
                right: curRules
              }
            })
          }
        }
      }
    }
    for (let i = 0; i < l; i++) {
      if (nt === this.grammer[i].left[0]) {
        let curfirst = this.passFirst(this.grammer[i].right[0])
        let pointer = 1
        let curRules = [this.grammer[i].right[0]]
        while (this.grammer[i].right[pointer] && this.grammer[i].right[pointer] !== '|') {
          curRules.push(this.grammer[i].right[pointer])
          pointer++
        }
        for (let m = 0; m < curfirst.length; m++) {
          if (!this.inArray(curfirst[m], this.NT[num].FirstArray)) {
            this.NT[num].FirstArray.push(curfirst[m])
            this.NT[num].First.push({
              first: curfirst[m],
              fromP: {
                left: this.grammer[i].left[0],
                right: curRules
              }
            })
          }
        }
      }
    }
  }
  flatten (arr) {
    return arr.reduce((pre, cur) => {
      return !Array.isArray(cur) ? [...pre, cur] : [...pre, ...this.flatten(cur)]
    }, [])
  }
  passFirst (str) {
    if (!(this.inArray(str, this.nonTerminator))) {
      return [str]
    } else {
      let res = []
      for (let i = 0; i < this.grammer.length; i++) {
        if (str === this.grammer[i].left[0]) {
          let newRight = this.depart(this.grammer[i].right)
          for (let t = 0; t < newRight.length; t++) {
            res.push(this.passFirst(newRight[t][0]))
          }
        }
      }
      return this.flatten(res)
    }
  }
  getFollowSet () {
    let l = this.nonTerminator.length
    for (let i = 0; i < l; i++) {
      this.getFollow(i, this.nonTerminator[i])
    }
  }
  getFollow (num, nt) {
    let l = this.grammer.length
    this.NT[0].Follow[0] = '$'
    for (let i = 0; i < l; i++) {
      if (nt === this.grammer[i].left[0]) {
        this.getFollowOne(nt, this.grammer[i].right)
      }
    }
  }
  depart (right) {
    // 拆分文法
    let l = right.length
    let j = 0
    let newRight = []
    for (let i = 0; i <= l; i++) {
      if (i === l) {
        newRight.push(right.slice(j, i))
        break
      } else if (right[i] === '|') {
        newRight.push(right.slice(j, i))
        j = i + 1
      }
    }
    return newRight
  }
  getFollowOne (left, right) {
    let curNT
    let nextNT
    let newRight = this.depart(right)

    // 依次求follow集
    for (let i = 0; i < newRight.length; i++) {
      for (let j = 0; j < newRight[i].length; j++) {
        if (this.inArray(newRight[i][j], this.nonTerminator)) {
          if (newRight[i][j + 1] && this.inArray(newRight[i][j + 1], this.nonTerminator)) {
            curNT = this.NT[this.searchArray(newRight[i][j], this.nonTerminator)]
            nextNT = this.NT[this.searchArray(newRight[i][j + 1], this.nonTerminator)]
            console.dir(`${left} → α ${newRight[i][j]} ${newRight[i][j + 1]}  first(${newRight[i][j + 1]}) = {${nextNT.FirstArray.join(' ')}}`)
            // A → αBβ β为非终结符 将 First(β)加入Follow(B)
            if (curNT !== undefined && nextNT !== undefined) {
              for (let k = 0; k < nextNT.FirstArray.length; k++) {
                if (nextNT.FirstArray[k] !== 'ε' && (!this.inArray(nextNT.FirstArray[k], curNT.Follow))) {
                  curNT.Follow.push(nextNT.FirstArray[k])
                }
              }
            }
          }
          if (newRight[i][j + 1] && (!this.inArray(newRight[i][j + 1], this.nonTerminator)) && (!this.inArray(newRight[i][j + 1], this.NT[this.searchArray(newRight[i][j], this.nonTerminator)].Follow))) {
            console.dir(`${left} → α ${newRight[i][j]} ${newRight[i][j + 1]}`)
            // A → αBβ β为终结符 将β加入Follow(B)
            this.NT[this.searchArray(newRight[i][j], this.nonTerminator)].Follow.push(newRight[i][j + 1])
          }
          if (newRight[i][j + 1] && (this.inArray(newRight[i][j + 1], this.nonTerminator)) && (this.isToBlank(newRight[i][j + 1]))) {
            // A → αBβ β =>* ε 将 Follow(A)加入Follow(B)
            console.dir(`${left} → α ${newRight[i][j]} ${newRight[i][j + 1]}  且 ${newRight[i][j + 1]} =>* ε`)
            let curFollow = this.NT[this.searchArray(newRight[i][j], this.nonTerminator)].Follow
            let curNt = this.NT[this.searchArray(left, this.nonTerminator)].Follow
            for (let o = 0; o < curNt.length; o++) {
              if (!this.inArray(curNt[o], curFollow)) {
                curFollow.push(curNt[o])
              }
            }
          } else if (!newRight[i][j + 1]) {
            // A → αB 将 Follow(A)加入Follow(B)
            console.dir(`${left} → α ${newRight[i][j]}`)
            let curFollow = this.NT[this.searchArray(newRight[i][j], this.nonTerminator)].Follow
            let curNt = this.NT[this.searchArray(left, this.nonTerminator)].Follow
            for (let o = 0; o < curNt.length; o++) {
              if (!this.inArray(curNt[o], curFollow)) {
                curFollow.push(curNt[o])
              }
            }
          }
        }
      }
    }
  }
  setNonterminator () { // 设置非终结符
    let l = this.grammer.length
    this.nonTerminator = []
    for (let i = 0; i < l; i++) {
      if (!this.inArray(this.grammer[i].left[0], this.nonTerminator)) {
        this.nonTerminator.push(this.grammer[i].left[0])
      }
    }
    this.NT = new Array(this.nonTerminator.length)
  }
  setTerminator () { // 设置终结符
    let l = this.grammer.length
    this.terminator = []
    for (let i = 0; i < l; i++) {
      for (let j = 0; j < this.grammer[i].right.length; j++) {
        if (!this.inArray(this.grammer[i].right[j], this.nonTerminator) && this.grammer[i].right[j] !== '|' && !this.inArray(this.grammer[i].right[j], this.terminator)) {
          this.terminator.push(this.grammer[i].right[j])
        }
      }
    }
  }
  isToBlank (nt) {
    for (let i = 0; i < this.grammer.length; i++) {
      if (nt === this.grammer[i].left[0]) {
        let newRight = this.depart(this.grammer[i].right)
        for (let t = 0; t < newRight.length; t++) {
          if (newRight[t][0] === 'ε') {
            return true
          } else if (this.inArray(newRight[t][0], this.nonTerminator)) {
            return this.isToBlank(newRight[t][0])
          }
        }
      }
    }
    return false
  }
  searchArray (str, array) {
    if (typeof array !== 'object') {
      return false
    } else {
      let found = []
      for (let i in array) {
        if (array[i] === str) {
          found.push(i)
        }
      }
      let num = found.length
      if (num === 0) return false
      if (num === 1) return found[0]
      return found
    }
  }
  inArray (search, array) {
    for (let i in array) {
      if (array[i] === search) {
        return true
      }
    }
    return false
  }
  preParseList (NT) {
    const row = NT.length
    let list = []
    for (let i = 0; i < row; i++) {
      for (let j = 0; j < NT[i].First.length; j++) {
        list.push({
          ntor: NT[i].ntor,
          tor: NT[i].First[j].first,
          product: NT[i].First[j].fromP
        })
        if (NT[i].First[j].first === 'ε') {
          for (let k = 0; k < NT[i].Follow.length; k++) {
            list.push({
              ntor: NT[i].ntor,
              tor: NT[i].Follow[k],
              product: NT[i].First[j].fromP
            })
          }
        }
      }
    }
    return list
  }
  searchProduct (nt, t) { // 在预测语法分析表中查找 nt → t 的产生式
    let ntIndex = this.searchArray(nt, this.nonTerminator)
    let tIndex = this.searchArray(t, this.terminator)
    let res = this.PPT.product[ntIndex][tIndex]
    if (res && res !== 'x') {
      return res
    }
    return false
  }
  parseToken () {
    if (!this.tokenArray || this.tokenArray === '') {
      return {
        status: false,
        errorType: 0,
        error: 'No token'
      }
    }
    let stack = [this.nonTerminator[0], '$'].reverse()
    let token = this.flatten([this.tokenArray, '$'])
    let value = this.flatten([this.tokenValue, '$'])
    let output = []
    let curP = this.PPT.product[0][0]
    const l = token.length
    for (let i = 0; i < l;) {
      if ((stack[stack.length - 1] === token[i]) && (token[i] === '$')) {
        return {
          status: true,
          output: output
        }
      } else if (stack[stack.length - 1] === 'ε') {
        stack.pop()
        console.log(stack)
      } else if ((stack[stack.length - 1] === token[i])) {
        output.push(curP)
        stack.pop()
        i++
        console.log(stack)
      } else if (this.inArray(stack[stack.length - 1], this.nonTerminator)) {
        curP = this.searchProduct(stack[stack.length - 1], token[i])
        if (curP) {
          stack.pop()
          for (let j = curP.right.length - 1; j >= 0; j--) {
            stack.push(curP.right[j])
          }
          console.log(stack)
        } else {
          let error = [{
            token: token[i],
            value: value[i]
          }]
          if (token[i - 1] && token[i + 1]) {
            error = [{
              token: token[i],
              value: value[i]
            }, {
              token: token[i - 1],
              value: value[i - 1]
            }, {
              token: token[i + 1],
              value: value[i + 1]
            }]
          }
          return {
            status: false,
            errorType: 2,
            error: error
          }
        }
      }
    }
  }
}
