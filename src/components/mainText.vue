<template>
  <div class="layout">
    <div class="header" ref="head">
      <div class="logo">
        Compiler
      </div>
      <div class="nav">
        <mu-tabs :value="activeTab" @change="handleTabChange" class="tab">
          <mu-tab value="tab1" title="Nav One"/>
          <mu-tab value="tab2" title="Nav TwO"/>
          <mu-tab value="tab3" title="Nav Three"/>
        </mu-tabs>
      </div>
    </div>
    <div class="content" ref="content">
      <div class="breadcrumb">
        <mu-breadcrumb>
          <mu-raised-button @click="cffx" label="词法分析"/>
          <mu-raised-button @click="cffx" label="语法分析"/>
          <mu-raised-button @click="cffx" label="语义分析"/>
          <mu-raised-button @click="cffx" label="中间代码" primary/>
          <mu-raised-button @click="cffx" label="代码优化"/>
          <mu-raised-button @click="cffx" label="目标代码" primary/>
        </mu-breadcrumb>
      </div>
      <div class="body">
        <div id="olContenter" @mouseover="_syncScroll" @mouseout="_clearSyncScroll">
          <textarea id="textareaOl" ref="textareaOl" :rows="textarea.rows" v-model="textarea.lineCountString" disabled></textarea>
        </div>
        <textarea id="mainTextArea" @keydown="textareaBind" @keyup="_textareaBind" @mouseover="syncScroll" @mouseout="clearSyncScroll" ref="mainTextArea" :rows="textarea.rows" v-model="textarea.code">
        </textarea>
      </div>
      <mu-snackbar v-if="snackbar.is" :message="snackbar.message" action="关闭" @actionClick="hideSnackbar" @close="hideSnackbar"/>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      activeTab: 'tab1',
      snackbar: {
        is: false,
        message: ''
      },
      textarea: {
        rows: 0,
        lineCount: 1,
        lineCountString: 1,
        MAXLINE: 10000,
        code: '#include "stdio.h"\n#include "stdlib.h"\n\nint mian(){\n  return 0;\n}'
      },
      lex: {
        keyword: {
          C: [
            'int', 'long', 'short', 'float', 'double', 'char', 'unsigned', 'signed',
            'const', 'void', 'volatile', 'enum', 'struct', 'union', 'if', 'else',
            'goto', 'switch', 'case', 'do', 'while', 'for', 'continue', 'break',
            'return', 'default', 'typedef', 'auto', 'register', 'extern', 'static', 'sizeof'
          ]
        }
      }
    }
  },
  methods: {
    handleTabChange (val) {
      this.activeTab = val
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
    cffx () {
      alert('词法分析')
    },
    getTextRows () {
      let contentHeight = window.screen.availHeight - this.$refs.head.offsetHeight - 135
      let res = Math.floor(contentHeight / 23)
      return res
    },
    getLineCount () {
      return this.textarea.code.split('\n').length
    },
    syncScroll () {
      this.$refs.mainTextArea.onscroll = () => {
        this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.scrollTop
      }
      this.$refs.mainTextArea.onmousemove = () => {
        this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.scrollTop
      }
    },
    clearSyncScroll () {
      this.$refs.mainTextArea.onscroll = () => {
        return false
      }
      this.$refs.mainTextArea.onmousemove = () => {
        return false
      }
    },
    _syncScroll () {
      this.$refs.textareaOl.onscroll = () => {
        this.$refs.mainTextArea.scrollTop = this.$refs.textareaOl.scrollTop
      }
    },
    _clearSyncScroll () {
      this.$refs.textareaOl.onscroll = () => {
        return false
      }
    },
    getSelection (el) {
      return (
        ('selectionStart' in el && function () {
          let l = el.selectionEnd - el.selectionStart
          return {
            start: el.selectionStart,
            end: el.selectionEnd,
            length: l,
            text: el.value.substr(el.selectionStart, l)
          }
        }) || (document.selection && function () {
          el.focus()
          let r = document.selection.createRange()
          if (r === null) {
            return {
              start: 0,
              end: el.value.length,
              length: 0
            }
          }
          let re = el.createTextRange()
          let rc = re.duplicate()
          re.moveToBookmark(r.getBookmark())
          rc.setEndPoint('EndToStart', re)
          return {
            start: rc.text.length,
            end: rc.text.length + r.text.length,
            length: r.text.length,
            text: r.text
          }
        }) || function () {
          return null
        }
      )()
    },
    _textareaBind () {
      this.textarea.lineCount = this.getLineCount()
      this.textarea.lineCountString = 1
      for (let i = 2; i <= this.textarea.lineCount; i++) {
        this.textarea.lineCountString += ('\n' + i)
      }
      this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.scrollTop
    },
    textareaBind (e) {
      let TABKEY = 9
      let ENTERKEY = 13
      let BACKSPACEKEY = 8
      let DELETEKEY = 46
      let str = '  '
      let obj = document.getElementById('mainTextArea')
      if (e.keyCode === TABKEY) {
        if (document.selection) {
          let sel = document.selection.createRange()
          sel.text = str
        } else if (typeof obj.selectionStart === 'number' && typeof obj.selectionEnd === 'number') {
          let startPos = obj.selectionStart
          let endPos = obj.selectionEnd
          let cursorPos = startPos
          let tmpStr = obj.value
          obj.value = tmpStr.substring(0, startPos) + str + tmpStr.substring(endPos, tmpStr.length)
          cursorPos += str.length
          obj.selectionStart = obj.selectionEnd = cursorPos
        } else {
          obj.value += str
        }
        if (e.preventDefault) {
          e.preventDefault()
        }
      } else if (e.keyCode === ENTERKEY) {
        this.textarea.lineCountString += ('\n' + (++(this.textarea.lineCount)))
      } else if (e.keyCode === BACKSPACEKEY || e.keyCode === DELETEKEY) {
        this.textarea.lineCount = this.getLineCount()
        this.textarea.lineCountString = 1
        for (let i = 2; i <= this.textarea.lineCount; i++) {
          this.textarea.lineCountString += ('\n' + i)
        }
      }
      this.$refs.textareaOl.scrollTop = this.$refs.mainTextArea.scrollTop
    }
  },
  mounted () {
    this.textarea.rows = this.getTextRows()
    this._textareaBind()
    window.onresize = () => {
      this.textarea.rows = this.getTextRows()
    }
  }
}
</script>
<style scoped>
.layout{
  height: 100%;
  background-color: rgb(236, 236, 236);
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

#mainTextArea{
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

#mainEdite{
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

#mainTextArea::selection{
  background: rgba(47,61,70,0.95);
}

#mainTextArea::-moz-selection{
  background: rgba(47,61,70,0.95);
}

#mainTextArea::-webkit-selection{
  background: rgba(47,61,70,0.95);
}

.footer{
  text-align: center;
}
</style>
