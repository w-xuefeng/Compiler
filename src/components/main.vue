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
          <mu-raised-button @click="cffx" label="语义分析"/>
          <mu-raised-button @click="cffx" label="中间代码" primary/>
          <mu-raised-button @click="cffx" label="代码优化"/>
          <mu-raised-button @click="cffx" label="目标代码" primary/>
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
    <ul class="footerInfor" ref="cnsoleT">
      <li v-for="(item, index) in consoleTai" :key="index" v-html="item">{{item}}</li>
    </ul>
  </div>
</template>
<script>
import editDiv from '@/components/editDiv.vue'
export default {
  data () {
    return {
      activeTab: 'tab1',
      consoleTai: ['<span style="color:#fff;">这是控制台</span>'],
      dialog: {
        is: false,
        title: '',
        content: []
      },
      snackbar: {
        is: false,
        message: ''
      },
      textarea: {
        rows: 0,
        height: '500',
        lineCount: 1,
        lineCountString: 1,
        MAXLINE: 10000,
        testCode: '#include "stdio.h"\n#include "stdlib.h"\n\nint mian(){\n    int a = 20, b = 30;\n    printf("%d\\n", a + b);\n    return 0;\n}',
        code: 'double max(double a, double b) {\n    return a > b ? a : b ;\n}'
      },
      lex: {
        keyword: {
          c: [
            'int', 'long', 'short', 'float', 'double', 'char', 'unsigned', 'signed',
            'const', 'void', 'volatile', 'enum', 'struct', 'union', 'if', 'else',
            'goto', 'switch', 'case', 'do', 'while', 'for', 'continue', 'break',
            'return', 'default', 'typedef', 'auto', 'register', 'extern', 'static', 'sizeof'
          ]
        }
      },
      codeLexPrase: {
        id: []
      },
      lexResAll: {
        binGroup: [],
        tokenArray: [],
        valueArray: []
      }
    }
  },
  methods: {
    handleTabChange (val) {
      this.activeTab = val
    },
    showCourseDesign () {
      this.openDialog(`编译原理 课程设计内容`, ['1.词法分析器', '2.语法分析器'])
    },
    showTeamInfor () {
      this.openDialog(`计科1501 小组成员信息`, ['王雪峰 20154845', '郑岩培 20154843', '凌秀雯 2015484x'])
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
    tirm (str) {
      return str.replace(/(^\s*)|(\s*$)/g, ``)
    },
    setId (str) {
      if (this.getId(str) === -1) {
        this.codeLexPrase.id.push(str)
      }
    },
    getId (str) {
      let res = -1
      for (let index = 0, l = this.codeLexPrase.id.length; index < l; index++) {
        if (str === this.codeLexPrase.id[index]) {
          res = index
          break
        }
      }
      return res
    },
    clearId () {
      this.codeLexPrase.id = []
    },
    isSysKey (key) {
      let res = false
      for (let i = 0, l = this.lex.keyword.c.length; i < l; i++) {
        if (this.lex.keyword.c[i] === key) {
          res = true
          break
        }
      }
      return res
    },
    isId (str) {
      return /^[A-Za-z_][A-Za-z0-9_]*$/.test(str)
    },
    isNum (str) {
      return !isNaN(str)
    },
    isZyzf (str) {
      return /(\\n|\\t|(%d)|(%f)|(%lf))+/.test(str)
    },
    isSeparator (str) {
      return /\+|-|\*|\/|=|!|==|===|!=|!==|\(|\)|\{|\}|\[|\]|,|;|\?|:|"|'|#|\.|\s|\n|<|>|!|%|&|\||&&|\|\|/.test(str)
    },
    oneLineParse (code, line) {
      let codeArray = code.split('')
      let lexArray = []
      let curLex = []
      for (let i = 0, j = 0, l = codeArray.length; i < l; i++) {
        if (codeArray[i] !== '\n' && this.tirm(codeArray[i]) !== ``) {
          curLex.push(codeArray[i])
        }
        if (this.isSeparator(codeArray[i])) {
          if (codeArray[i] !== '\n' && this.tirm(codeArray[i]) !== ``) {
            lexArray[j + 1] = curLex.pop()
            lexArray[j] = curLex.join('')
            j += 2
          } else {
            lexArray[j] = curLex.join('')
            j++
          }
          curLex = []
        }
      }
      let lexRes = []
      for (let i = 0; i < lexArray.length; i++) {
        if (this.tirm(lexArray[i]) === ``) {
          lexArray.splice(i, 1)
          i = i - 1
        }
      }
      for (let i = 0, l = lexArray.length; i < l; i++) {
        if (this.isSysKey(lexArray[i])) {
          lexRes[i] = {
            token: lexArray[i],
            value: `-`
          }
        } else if (this.isId(lexArray[i])) {
          this.setId(lexArray[i])
          lexRes[i] = {
            token: `id`,
            value: this.getId(lexArray[i])
          }
        } else if (this.isNum(lexArray[i])) {
          lexRes[i] = {
            token: `num`,
            value: lexArray[i]
          }
        } else if (this.isSeparator(lexArray[i])) {
          lexRes[i] = {
            token: `Separator`,
            value: lexArray[i]
          }
        } else if (this.isZyzf(lexArray[i])) {
          lexRes[i] = {
            token: `Zyzf`,
            value: lexArray[i]
          }
        } else {
          this.showSnackbar(`出现词法错误 [${line + 1}]`, 5000)
          this.addConsole(`<span style="color:red;">词法错误 [${line + 1}]：${lexArray[i]}</span>`)
          return
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
      this.highLighting()
      let code = this.$refs.mainTextArea.$el.innerText
      let codeLine = code.split('\n')
      let lexRes = []
      this.initLexParse()
      for (let line = 0, l = codeLine.length; line < l; line++) {
        lexRes[line] = this.oneLineParse(codeLine[line], line)
        for (let i = 0; i < lexRes[line].length; i++) {
          this.lexResAll.binGroup.push(`<` + lexRes[line][i].token + `,` + lexRes[line][i].value + `>`)
          this.lexResAll.tokenArray.push(lexRes[line][i].token)
          this.lexResAll.valueArray.push(lexRes[line][i].value)
        }
      }
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
      this.lexParse()
      this.showSnackbar('词法分析完成', 2000)
      this.addConsole('<span style="color:#fff;">词法分析完成 返回二元组如下：</span>')
      this.addConsole(this.htmlspecialchar(this.lexResAll.binGroup))
      // this.openDialog('词法分析返回结果', this.lexResAll.binGroup)
    },
    yffx () {
      if (this.lexResAll.tokenArray.length === 0) {
        this.lexParse()
      }
      let tokenStr = this.lexResAll.tokenArray.join(' ')
      console.dir(tokenStr)
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
