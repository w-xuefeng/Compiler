<template>
  <div class="layout">
    <div class="header" ref="head">
      <div class="logo">
        Compiler
      </div>
      <div class="nav">
        <mu-tabs :value="activeTab" @change="handleTabChange" class="tab">
          <mu-tab value="tab1" title="编译原理"/>
          <mu-tab value="tab2" @click="showCourseDesign" title="课程设计"/>
          <mu-tab value="tab3" @click="showTeamInfor" title="By 雪峰小组"/>
        </mu-tabs>
      </div>
    </div>
    <div class="content" ref="content">
      <div class="breadcrumb">
        <mu-breadcrumb>
          <mu-raised-button @click="cffx" label="词法分析"/>
          <mu-raised-button @click="yffx" label="语法分析"/>
          <mu-raised-button @click="showPreList" label="预测语法分析表"/>
          <mu-raised-button @click="midCode" label="中间代码" primary/>
          <mu-raised-button @click="showSnackbar('敬请期待', 2000)" label="目标代码" primary/>
          <mu-raised-button @click="clearConsole" label="清空控制台"/>
        </mu-breadcrumb>
      </div>
      <div class="body">
        <div id="olContenter" @mouseover="_syncScroll" @mouseout="_clearSyncScroll">
          <textarea id="textareaOl" ref="textareaOl" :style="{'height':textarea.height + 'px'}" v-model="textarea.lineCountString" disabled></textarea>
        </div>
        <div-edite id="mainTextArea" class="mainTextArea" ref="mainTextArea" v-model="textarea.code" :style="{'height':textarea.height + 'px'}"></div-edite>
      </div>
      <mu-dialog :open="dialog.is" @close="closeDialog" :title="dialog.title" scrollable>
        <mu-menu>
          <mu-menu-item :title="content" v-for="(content, index) in dialog.content" :key="index"/>
        </mu-menu>
        <mu-flat-button primary label="复制内容" @click="copyDialogContent" slot="actions"/>
        <mu-flat-button primary label="关闭" @click="closeDialog" slot="actions"/>
      </mu-dialog>
      <mu-snackbar v-if="snackbar.is" :message="snackbar.message" action="关闭" @actionClick="hideSnackbar" @close="hideSnackbar"/>
    </div>
    <mu-drawer :open="drawer.open" :docked="drawer.docked" @close="drawertoggle()" width="100%" class="drawer">
      <h1>预测语法分析表</h1>
      <table class="table" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr style="width:100%;">
          <td>T/NT</td>
          <td v-for="(T, index) in preParseTable.tor" :key="index">{{T}}</td>
        </tr>
        <tr v-for="(NT, index) in preParseTable.ntor" :key="index" style="width:100%;">
          <td>{{NT}}</td>
          <td v-for="(pro, indexp) in preParseTable.tor" :key="indexp">
            <span v-if="preParseTable.product[index][indexp] !== 'x'">{{preParseTable.product[index][indexp].left}} → {{preParseTable.product[index][indexp].right.join('')}}</span>
            <span v-if="preParseTable.product[index][indexp] === 'x'">x</span>
          </td>
        </tr>
      </table>
      <mu-float-button icon="close" v-if="drawer.docked" @click.native="drawer.open = false" style="position:fixed;right:3em;top:3em;"/>
    </mu-drawer>
    <ul class="footerInfor" ref="cnsoleT">
      <li v-for="(item, index) in consoleTai" :key="index" v-html="item">{{item}}</li>
    </ul>
  </div>
</template>
<script>
import editDiv from '@/components/editDiv.vue'
import Parse from '../assets/parselib/parse.js'
import Trans from '../assets/parselib/midcode.js'
export default {
  data () {
    return {
      activeTab: 'tab1',
      PARSE: '',
      consoleTai: ['<span style="color:#fff;">这是控制台</span>'], // 控制台信息
      dialog: {
        is: false, // 是否显示弹窗
        title: '', // 弹窗标题
        content: [] // 弹窗内容
      },
      drawer: {
        open: false,
        docked: true
      },
      preParseTable: {
        tor: [],
        ntor: [],
        product: [[{
          left: '',
          right: ''
        }]]
      },
      snackbar: {
        is: false, // 是否显示提示
        message: '' // 提示内容
      },
      textarea: {
        rows: 0, // 编辑器最大行数
        height: '500', // 编辑器高度
        lineCount: 1, // 编辑器代码行数
        lineCountString: 1, // 代码行数字符串
        MAXLINE: 10000, // 允许的最大代码行数
        code: `A = B + C * D;
Z = - Y * (M + N) + X;
/*void main(){
  int a = 10; //这是一行注释
  int b = 20, c = 30;
  int d = a + b * c;
  double pi = 3.14;
  double r = 5;
  double area = pi * r * r;
}

* int 123abc = 123;
* 这是多行注释
* 这里的任何错误将被忽略
*/
` // 代码内容 测试代码
      },
      lex: {
        keyword: { // 系统关键字
          c: [
            'int', 'long', 'short', 'float', 'double', 'char', 'unsigned', 'signed',
            'const', 'void', 'volatile', 'enum', 'struct', 'union', 'if', 'else',
            'goto', 'switch', 'case', 'do', 'while', 'for', 'continue', 'break',
            'return', 'default', 'typedef', 'auto', 'register', 'extern', 'static', 'sizeof'
          ]
        }
      },
      mulitRelop: ['<=', '>=', '==', '!=', '<>'], // 多位关系运算符数组
      codeLexPrase: { // 词法分析器存储用户自定义标识符的数组
        id: []
      },
      lexResAll: { // 词法分析结果
        binGroup: [], // 二元组
        tokenArray: [], // token
        valueArray: [] // 属性值
      },
      grammerParse: { // 文法规则
        grammer: [{ // S -> void id(){A}
          left: ['S'],
          right: ['void', 'id', '(', ')', '{', 'A', '}']
        }, { // X -> YZ;
          left: ['X'],
          right: ['Y', 'Z', ';']
        }, { // Y -> int|float|double|char|bool
          left: ['Y'],
          right: ['int', '|', 'float', '|', 'double', '|', 'char', '|', 'bool']
        }, { // Z -> UZ’
          left: ['Z'],
          right: ['U', 'Z’']
        }, { // Z’ -> ,Z|ε
          left: ['Z’'],
          right: [',', 'Z', '|', 'ε']
        }, { // U -> idU’
          left: ['U'],
          right: ['id', 'U’']
        }, { // U’ -> =L|ε
          left: ['U’'],
          right: ['=', 'L', '|', 'ε']
        }, { // R -> id=L;
          left: ['R'],
          right: ['id', '=', 'L']
        }, { // L - >TL’
          left: ['L'],
          right: ['T', 'L’']
        }, { // L’ -> +L|-L|ε
          left: ['L’'],
          right: ['+', 'L', '|', '-', 'L', '|', 'ε']
        }, { // T -> FT’
          left: ['T'],
          right: ['F', 'T’']
        }, { // T’ -> *T|/T|ε
          left: ['T’'],
          right: ['*', 'T', '|', '/', 'T', '|', 'ε']
        }, { // F -> (L)
          left: ['F'],
          right: ['(', 'L', ')']
        }, { // F -> id|num
          left: ['F'],
          right: ['id', '|', 'num']
        }, { // O -> ++|--|ε
          left: ['O'],
          right: ['++', '|', '--', '|', 'ε']
        }, { // Q -> idO|ε
          left: ['Q'],
          right: ['id', 'O', '|', 'ε']
        }, { // E -> HE’
          left: ['E'],
          right: ['H', 'E’']
        }, { // E’ -> &&E|ε
          left: ['E’'],
          right: ['&&', 'E', '|', 'ε']
        }, { // H -> GH
          left: ['H'],
          right: ['G', 'H']
        }, { // H’ -> ||H
          left: ['H’'],
          right: ['||', 'H']
        }, { // H’ -> ε
          left: ['H’'],
          right: ['ε']
        }, { // G -> FDF
          left: ['G'],
          right: ['F', 'D', 'F']
        }, { // D -> <|>|==|!=
          left: ['D'],
          right: ['<', '|', '>', '|', '==', '!=']
        }, { // G -> (E)
          left: ['G'],
          right: ['(', 'E', ')']
        }, { // G -> !E
          left: ['G'],
          right: ['!', 'E']
        }, { // B -> if (E){A}else{A}
          left: ['B'],
          right: ['if', '(', 'E', ')', '{', 'A', '}', 'else', '{', 'A', '}']
        }, { // B -> while(E){A}
          left: ['B'],
          right: ['while', '(', 'E', ')', '{', 'A', '}']
        }, { // B->for(YZ;G;Q){A}
          left: ['B'],
          right: ['for', '(', 'Y', 'Z', ';', 'G', ';', 'Q', ')', '{', 'A', '}']
        }, { // A -> CA
          left: ['A'],
          right: ['C', 'A']
        }, { // C -> X|B|R
          left: ['C'],
          right: ['X', '|', 'B', '|', 'R']
        }, { // A -> ε
          left: ['A'],
          right: ['ε']
        }]
      }
    }
  },
  methods: {
    handleTabChange (val) {
      this.activeTab = val
    },
    showCourseDesign () {
      this.openDialog(`编译原理 课程设计内容`, ['1.词法分析器', '2.语法分析器', '3.中间代码生成'])
    },
    showTeamInfor () {
      this.openDialog(`计科1501 小组成员信息`, ['王雪峰 20154845', '郑岩培 20154843', '凌秀雯 20154834'])
    },
    openDialog (title, content) {
      this.dialog.is = true
      this.dialog.title = title
      this.dialog.content = content
    },
    closeDialog () {
      this.dialog.is = false
      this.dialog.title = ''
      this.dialog.content = []
    },
    drawertoggle (flag) {
      this.drawer.open = !this.drawer.open
      this.drawer.docked = !flag
    },
    showPreList () {
      this.preParseTable = this.PARSE.PPT
      this.drawertoggle()
    },
    copyDialogContent () {
      let input = document.createElement('input')
      let content = this.dialog.content.join(`\n`)
      input.value = content
      document.body.appendChild(input)
      input.select()
      document.execCommand('Copy')
      input.className = 'input'
      input.style.display = 'none'
      this.showSnackbar('内容已复制到剪贴板😄', 2000)
    },
    scrollToBottom (element) {
      this.$nextTick(() => {
        element.scrollTop = element.scrollHeight
      })
    },
    addConsole (content) {
      new Promise((resolve, reject) => {
        if (Array.isArray(content)) {
          this.consoleTai = this.flatten([this.consoleTai, this.flatten(content)])
          resolve()
        } else if (typeof content === 'string') {
          this.consoleTai.push(content)
          resolve()
        } else {
          reject(content)
        }
      }).then(() => {
        this.scrollToBottom(this.$refs.cnsoleT)
      })
    },
    addColorTextConsole (color, content) {
      this.addConsole(`<span style="color:${color};">${content}</span>`)
    },
    clearConsole () {
      this.consoleTai = ['<span style="color:#fff;">这是控制台</span>']
    },
    flatten (arr) {
      return arr.reduce((pre, cur) => {
        return !Array.isArray(cur) ? [...pre, cur] : [...pre, ...this.flatten(cur)]
      }, [])
    },
    showSnackbar (msg, time) {
      this.snackbar.message = msg
      this.snackbar.is = true
      if (this.snackTimer) clearTimeout(this.snackTimer)
      this.snackTimer = setTimeout(() => { this.snackbar.is = false }, time)
    },
    hideSnackbar () {
      this.snackbar.is = false
      if (this.snackTimer) clearTimeout(this.snackTimer)
    },
    delRemark (str) {
      return str.replace(/\/\*[\s\S]*\*\/|\/\/.*/g, ``)
    },
    tirm (str) {
      return str.replace(/(^\s*)|(\s*$)/g, ``)
    },
    setId (str) { // 存储id
      if (this.getId(str) === -1) {
        this.codeLexPrase.id.push(str)
      }
    },
    getId (str) { // 获取id的地址
      let res = -1
      for (let index = 0, l = this.codeLexPrase.id.length; index < l; index++) {
        if (str === this.codeLexPrase.id[index]) {
          res = index
          break
        }
      }
      return res
    },
    clearId () { // 清除存储的id
      this.codeLexPrase.id = []
    },
    isSysKey (key) { // 判断是否是系统关键字
      return this.inArray(key, this.lex.keyword.c)
    },
    isId (str) { // 判断是否是用户自定义标识符
      return /^[A-Za-z_][A-Za-z0-9_]*$/.test(str)
    },
    isNum (str) { // 判断是否是数字
      return !isNaN(str)
    },
    isFloat (str) { // 判断是否为小数
      return /^\d+(\.\d+)?$/.test(str)
    },
    isRelop (str) { // 判断是否是关系运算符
      return /([><!]=?|==)/.test(str)
    },
    isAssign (str) { // 判断是否是赋值符
      return /=/.test(str) && str === '='
    },
    isZyzf (str) { // 判断是否是转义字符
      return /(\\n|\\t|(%d)|(%f)|(%lf))+/.test(str)
    },
    isSeparator (str) { // 判断是否是分隔符
      return /\+|-|\*|\/|=|!|!=|!==|\(|\)|\{|\}|\[|\]|,|;|\?|:|"|'|#|\.|\s|\n|<|>|!|%|&|\||&&|\|\|/.test(str)
    },
    inArray (search, array) {
      for (let i in array) {
        if (array[i] === search) {
          return true
        }
      }
      return false
    },
    /*
    * @ function 对一行代进行码分析
    * @ param code 一行代码
    * @ param line 代码所在行号
    * @ return lexRes or false 若无词法错误，返回分析结果lexRes，否则返回false且显示报错
    */
    oneLineParse (code, line) {
      let codeArray = code.split('') // 按字符分割代码到数组
      let lexArray = [] // 完整的词素数组
      let curLex = [] // 当前分析的词素
      for (let i = 0, j = 0, l = codeArray.length; i < l; i++) {
        if (codeArray[i] !== '\n' && this.tirm(codeArray[i]) !== ``) {
          curLex.push(codeArray[i]) // 将字符拼接为词素
        }
        if (this.isSeparator(codeArray[i])) { // 当前字符为分隔符
          if (codeArray[i] !== '\n' && this.tirm(codeArray[i]) !== ``) { // 当前字符不为空格和换行符
            if (this.inArray(codeArray[i] + codeArray[i + 1], this.mulitRelop)) { // 当前字符和下一字符组成多位关系运算符
              curLex.push(codeArray[i + 1]) // 将下一字符压进数组
              lexArray[j] = curLex.join('') // 将当前字符数组拼接为一个词素
              j++ // 词素数组后移
              i++ // 分析光标后移
            } else if (codeArray[i] === '.' && this.isNum(codeArray[i - 1])) { // 若当前字符为小数点，且前一位是数字，则将小数点压如数组
              continue
            } else {
              lexArray[j + 1] = curLex.pop() // 将最后一个字符（分隔符）弹出当前分析词素的数组且作为下一个词素
              lexArray[j] = curLex.join('') // 将当前字符数组拼接为一个词素
              j += 2 // 词素数组后移2位
            }
          } else {
            lexArray[j] = curLex.join('') // 将当前字符数组拼接为一个词素
            j++ // 词素数组后移
          }
          curLex = [] // 一轮分析完成清空当前分析词素数组
        }
      }
      let lexRes = [] // 词法分析结果
      for (let i = 0; i < lexArray.length; i++) {
        if (this.tirm(lexArray[i]) === ``) {
          lexArray.splice(i, 1) // 删除词素数组中的空词素
          i = i - 1
        }
      }
      for (let i = 0, l = lexArray.length; i < l; i++) {
        if (this.isSysKey(lexArray[i])) {
          lexRes[i] = { // 系统关键字二元组对象
            token: lexArray[i],
            value: `-`
          }
        } else if (this.isId(lexArray[i])) {
          this.setId(lexArray[i])
          lexRes[i] = { // 用户自定义标识符二元组对象
            token: `id`,
            value: this.getId(lexArray[i])
          }
        } else if (this.isFloat(lexArray[i])) {
          lexRes[i] = { // 小数字二元组对象
            token: `num`,
            value: lexArray[i]
          }
        } else if (this.isNum(lexArray[i])) {
          lexRes[i] = { // 数字二元组对象
            token: `num`,
            value: lexArray[i]
          }
        } else if (this.isRelop(lexArray[i])) {
          lexRes[i] = { // 关系运算符二元组对象
            token: lexArray[i], // relop
            value: lexArray[i]
          }
        } else if (this.isAssign(lexArray[i])) {
          lexRes[i] = { // 赋值符二元组对象
            token: lexArray[i], // assign
            value: lexArray[i]
          }
        } else if (this.isSeparator(lexArray[i])) {
          lexRes[i] = { // 分隔符二元组对象
            token: lexArray[i],
            value: lexArray[i]
          }
        } else if (this.isZyzf(lexArray[i])) {
          lexRes[i] = { // 转义字符二元组对象
            token: `Zyzf`,
            value: lexArray[i]
          }
        } else { // 出现词法错误
          this.showSnackbar(`出现词法错误 [${line + 1}]`, 5000)
          this.addColorTextConsole('red', `词法错误 [${line + 1}]：${lexArray[i]}`)
          return false
        }
      }
      return lexRes
    },
    initLexParse () {
      this.clearId()
      this.lexResAll.binGroup = []
      this.lexResAll.tokenArray = []
      this.lexResAll.valueArray = []
    },
    lexParse () {
      let code = this.tirm(this.delRemark(this.$refs.mainTextArea.$el.innerText))
      this.$refs.mainTextArea.$el.innerText = code
      this._textareaBind()
      this.highLighting()
      let codeLine = code.split('\n')
      let lexRes = []
      this.initLexParse()
      for (let line = 0, l = codeLine.length; line < l; line++) {
        lexRes[line] = this.oneLineParse(codeLine[line], line)
        if (!lexRes[line]) {
          return false
        }
        for (let i = 0; i < lexRes[line].length; i++) {
          this.lexResAll.binGroup.push(`<${lexRes[line][i].token}, ${lexRes[line][i].value}>`)
          this.lexResAll.tokenArray.push(lexRes[line][i].token)
          this.lexResAll.valueArray.push(lexRes[line][i].value)
        }
      }
      return true
    },
    htmlspecialchar (strOrArray) {
      let content = this.flatten([strOrArray])
      let binArray = []
      let l = content.length
      for (let i = 0; i < l; i++) {
        binArray[i] = content[i].replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
      return binArray
    },
    cffx () {
      this.addConsole('开始词法分析')
      if (this.lexParse()) {
        this.showSnackbar('词法分析完成', 2000)
        this.addColorTextConsole('#fff', '词法分析完成 返回二元组如下：')
        this.addConsole(this.htmlspecialchar(this.lexResAll.binGroup))
        console.dir(this.lexResAll.binGroup)
      }
    },
    parseRules () {
      let grammerRules = []
      for (let i = 0; i < this.grammerParse.grammer.length; i++) {
        grammerRules[i] = `${this.grammerParse.grammer[i].left[0]} → ${this.grammerParse.grammer[i].right.join('')}`
      }
      return grammerRules
    },
    yffx () {
      if (!this.lexParse()) {
        return {status: false}
      }
      this.addConsole('开始语法分析')
      this.addColorTextConsole('#fff', '使用如下文法规则：')
      this.addConsole(this.parseRules())
      let tokenStr = this.lexResAll.tokenArray.join(' ')
      let parse = this.PARSE
      parse.tokenArray = this.lexResAll.tokenArray
      parse.tokenValue = this.lexResAll.valueArray
      console.dir(parse.PPT)
      console.dir(parse.NT)
      this.preParseTable = parse.PPT
      this.addColorTextConsole('#fff', '文法的 First 集如下:')
      for (let i = 0; i < parse.nonTerminator.length; i++) {
        console.dir(`First(${parse.NT[i].ntor}) = {${parse.NT[i].FirstArray.join('，')}}`)
        this.addConsole(`First(${parse.NT[i].ntor}) = {${parse.NT[i].FirstArray.join('，')}}`)
      }
      this.addColorTextConsole('#fff', '文法的 Follow 集如下:')
      for (let i = 0; i < parse.nonTerminator.length; i++) {
        console.dir(`Follow(${parse.NT[i].ntor}) = {${parse.NT[i].Follow.join('，')}}`)
        this.addConsole(`Follow(${parse.NT[i].ntor}) = {${parse.NT[i].Follow.join('，')}}`)
      }
      let res = parse.parseToken()
      if (res.status) {
        this.showSnackbar('语法分析完成', 2000)
        this.addColorTextConsole('#fff', '语法分析完成 返回如下:')
        this.addColorTextConsole('green', 'token序列：')
        this.addConsole(tokenStr)
        this.addColorTextConsole('green', '分析输出产生式')
        for (let i = 0; i < res.output.length; i++) {
          this.addConsole(`${res.output[i].left} → ${res.output[i].right.join('')}`)
        }
      } else {
        console.dir(res)
        if (res.errorType === 2) {
          this.showSnackbar('发生语法错误', 2000)
          let error = this.ifIdGet(res.error[0].token, res.error[0].value)
          if (res.error.length > 1) {
            error = `${this.ifIdGet(res.error[1].token, res.error[1].value)} ${error} ${this.ifIdGet(res.error[2].token, res.error[2].value)}`
          }
          this.addColorTextConsole('red', `发生语法错误： " ${error} "`)
        } else {
          this.showSnackbar(`语法分析出现错误 ErrorType: ${res.errorType}`, 2000)
          this.addColorTextConsole('red', `语法分析出现错误 ErrorType: ${res.errorType}`)
        }
      }
      return res
    },
    midCode () {
      this.midCreate()
    },
    midCreate () {
      let code = this.tirm(this.delRemark(this.$refs.mainTextArea.$el.innerText))
      this.$refs.mainTextArea.$el.innerText = code
      this._textareaBind()
      this.highLighting()
      let codeLine = code.split('\n')
      let Res = []
      for (let line = 0, l = codeLine.length; line < l; line++) {
        Res[line] = this.midCreateOneLine(codeLine[line])
        this.addConsole(Res[line])
        console.dir(Res[line])
      }
      return true
    },
    midCreateOneLine (input) {
      let codeArray = input.split('')
      let n = 1
      let tempOut = []
      let number = []
      let trans = new Trans(codeArray)
      let output = trans.justDoIt()
      console.dir(output)
      for (let i = 0; i < output.length; i++) {
        let t = output[i]
        if (t === '+') {
          let n1 = number.pop()
          let n2 = number.pop()
          let n3 = `t${n}`
          n++
          number.push(n3)
          tempOut.push(`${n - 1}.  ( +, ${n2}, ${n1}, ${n3})`)
        } else if (t === '-') {
          let n1 = number.pop()
          let n3 = `t${n}`
          n++
          number.push(n3)
          tempOut.push(`${n - 1}.  ( -, ${n1},  , ${n3})`)
        } else if (t === '*') {
          let n1 = number.pop()
          let n2 = number.pop()
          let n3 = `t${n}`
          n++
          number.push(n3)
          tempOut.push(`${n - 1}.  ( *, ${n2}, ${n1}, ${n3})`)
        } else if (t === '/') {
          let n1 = number.pop()
          let n2 = number.pop()
          let n3 = `t${n}`
          n++
          number.push(n3)
          tempOut.push(`${n - 1}.  ( /, ${n2}, ${n1}, ${n3})`)
        } else if (/[a-zA-Z0-9=]/.test(t)) {
          number.push(t)
        }
      }
      console.log()
      let last2 = number.pop()
      number.pop()
      let last1 = number.pop()
      n++
      tempOut.push(`${n - 1}.  ( =, ${last2},  , ${last1})`)
      return tempOut
    },
    ifIdGet (token, value) {
      if (token === 'id') {
        return this.codeLexPrase.id[value]
      } else if (this.isSysKey(token)) {
        return token
      }
      return value
    },
    getTextRows () {
      let contentHeight = window.screen.availHeight - this.$refs.head.offsetHeight - 320
      let res = Math.floor(contentHeight / 23)
      return {height: contentHeight, row: res}
    },
    getLineCount () {
      let linCount = this.$refs.mainTextArea.$el.innerText.split('\n')
      return linCount[linCount.length - 1] === `` ? linCount.length - 1 : linCount.length
    },
    syncScroll () {
      this.$refs.mainTextArea.$el.onscroll = () => {
        this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.$el.scrollTop
      }
      this.$refs.mainTextArea.$el.onmousemove = () => {
        this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.$el.scrollTop
      }
    },
    clearSyncScroll () {
      this.$refs.mainTextArea.$el.onscroll = () => {
        return false
      }
      this.$refs.mainTextArea.$el.onmousemove = () => {
        return false
      }
    },
    _syncScroll () {
      this.$refs.textareaOl.onscroll = () => {
        this.$refs.mainTextArea.$el.scrollTop = this.$refs.textareaOl.scrollTop
      }
    },
    _clearSyncScroll () {
      this.$refs.textareaOl.onscroll = () => {
        return false
      }
    },
    _textareaBind () {
      this.textarea.lineCount = this.getLineCount()
      this.textarea.lineCountString = 1
      for (let i = 2; i <= this.textarea.lineCount; i++) {
        this.textarea.lineCountString += ('\n' + i)
      }
      this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.$el.scrollTop
    },
    textareaBind (e) {
      let TABKEY = 9
      let ENTERKEY = 13
      let BACKSPACEKEY = 8
      let DELETEKEY = 46
      let str = '    '
      let obj = this.$refs.mainTextArea.$el
      if (e.keyCode === TABKEY) {
        let doc = obj.ownerDocument.defaultView
        let sel = doc.getSelection()
        let range = sel.getRangeAt(0)
        let tabNode = document.createTextNode(str)
        range.insertNode(tabNode)
        range.setStartAfter(tabNode)
        range.setEndAfter(tabNode)
        sel.removeAllRanges()
        sel.addRange(range)
        if (e.preventDefault) {
          e.preventDefault()
        }
      } else if (e.keyCode === ENTERKEY) {
        if (this.textarea.lineCount >= this.textarea.MAXLINE) {
          this.showSnackbar('已达到最大行数', 2000)
          return
        }
        this.textarea.lineCountString += ('\n' + (++(this.textarea.lineCount)))
      } else if (e.keyCode === BACKSPACEKEY || e.keyCode === DELETEKEY) {
        this.textarea.lineCount = this.getLineCount()
        this.textarea.lineCountString = 1
        for (let i = 2; i <= this.textarea.lineCount; i++) {
          this.textarea.lineCountString += ('\n' + i)
        }
      }
      this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.$el.scrollTop
    },
    highLighting () {
      let regLetter = new RegExp(`([a-zA-Z][a-zA-Z0-9_]*)`, `g`)
      let resultLetter = this.$refs.mainTextArea.$el.innerText.replace(regLetter, `<span style='color: rgb(77,153,178);'>$1</span>`)
      let keywords = this.lex.keyword.c.join(`|`)
      let regKeywords = new RegExp(`>(` + keywords + `)<`, `g`)
      let resultKeywords = resultLetter.replace(regKeywords, `><span style='color: rgb(197,148,197);'>$1</span><`)
      this.$refs.mainTextArea.$el.innerHTML = resultKeywords
    },
    bindEvent () {
      let _ref_ = this.$refs.mainTextArea.$el
      _ref_.onkeydown = () => {
        this.textareaBind(window.event)
      }
      _ref_.onkeyup = () => {
        this._textareaBind()
      }
      _ref_.onmouseover = () => {
        this.syncScroll()
      }
      _ref_.onmouseout = () => {
        this.clearSyncScroll()
      }
      _ref_.oninput = () => {
      }
    }
  },
  components: {
    'div-edite': editDiv
  },
  watch: {
    'processData': 'scrollToBottom'
  },
  mounted () {
    this.PARSE = new Parse(['$'], [''], this.grammerParse.grammer)
    this.PARSE.getSet()
    this.textarea.height = this.getTextRows().height
    this.bindEvent()
    this.highLighting()
    this._textareaBind()
    window.onresize = () => {
      this.textarea.height = this.getTextRows().height
    }
  }
}
</script>
<style scoped>
.layout{
  height: 100%;
  background-color: rgb(236, 236, 236);
  font-family: '微软雅黑'
}

.header{
  background-color: rgb(33, 150, 243);
}

.logo{
  font-size: 24px;
  color: white;
  display: inline-block;
  padding: 10px 20px;
}

.nav{
  display: inline-block;
  width: calc(100% - 150px);
  margin: 0 auto;
}

.tab{
  margin: 0 auto;
  width: 400px;
  background-color: rgba(0, 0, 0, 0);
}

.content{
  width: 90%;
  margin: 0 auto;
}

.breadcrumb{
  margin: 16px 0;
}

.body{
  position: relative;
  background: none;
  overflow: hidden;
}

.mu-content-block{
  padding-right: 0px;
}

.mainTextArea{
  width: 100%;
  height: 100%;
  padding-left: 55px;
  border: none;
  outline: none;
  resize: none;
  background: rgb(27,43,52);
  caret-color: white;
  color: rgb(205,211,222);
}

#olContenter{
  position: absolute;
  overflow: hidden;
  width: 50px;
  left: 0px;
  top: 0px;
  background: none;
}

#textareaOl{
  min-width: 50px;
  max-width: 53px;
  text-align: right;
  padding-right: 10px;
  border: none;
  outline: none;
  resize: none;
  background: rgba(0,0,0,0.55);
  color: grey;
  -webkit-user-select:none;
  -moz-user-select:none;
  -ms-user-select:none;
  user-select:none;
}

#textareaOl::-webkit-scrollbar{
  width:0px;
}

#textareaOl::-moz-scrollbar{
  width:0px;
}

#textareaOl::-ms-scrollbar{
  width:0px;
}

#mainTextArea::-webkit-scrollbar{
  width:10px;
  height:10px;
}

#mainTextArea::-webkit-scrollbar-button{
  background-color:rgba(255,255,255,0.45);
  height: 0px;
}

#mainTextArea::-webkit-scrollbar-track{
  background:rgba(45,60,68,1);
}

#mainTextArea::-webkit-scrollbar-track-piece{
  background:rgba(45,60,68,1);
}

#mainTextArea::-webkit-scrollbar-thumb{
  background:rgba(76,89,95,1);
  border-radius:2px;
}

#mainTextArea::-webkit-scrollbar-corner{
  background:none;
  height: 0px;
}

#mainTextArea::-webkit-scrollbar-resizer{
  background:#FF0BEE;
}

.drawer{
  padding: 100px 10px 10px;
  text-align: center;
}

.table{
  border: 1px solid #000;
  margin-bottom: 3px;
}
.table >tr>td {
  border: 1px solid #000;
  min-width: 2em;
  min-height: 2em;
  text-align: center;
  font-size: 10px;
}

.footerInfor{
  width: 90%;
  height: 110px;
  margin: 10px auto;
  overflow-y: auto;
  overflow-x: hidden;
  background: rgb(12,19,23);
  color: dodgerblue;
  -webkit-padding-start: 0px;
  padding-left: 20px;
}
</style>
