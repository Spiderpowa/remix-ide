/* global FileReader */
/* global fetch */
const async = require('async')
const Gists = require('gists')
const modalDialogCustom = require('../ui/modal-dialog-custom')
const tooltip = require('../ui/tooltip')
const QueryParams = require('../../lib/query-params')
const helper = require('../../lib/helper')
const yo = require('yo-yo')
const Treeview = require('../ui/TreeView')
const modalDialog = require('../ui/modaldialog')
const EventManager = require('../../lib/events')
const contextMenu = require('../ui/contextMenu')
const css = require('./styles/file-explorer-styles')
const globalRegistry = require('../../global/registry')
const queryParams = new QueryParams()
let MENU_HANDLE

function fileExplorer (localRegistry, files, menuItems) {
  var self = this
  this.events = new EventManager()
  // file provider backend
  this.files = files
  // element currently focused on
  this.focusElement = null
  // path currently focused on
  this.focusPath = null
  let allItems =
    [
      { action: 'createNewFile',
        title: 'Create New File',
        icon: 'fas fa-plus-circle'
      },
      { action: 'publishToGist',
        title: 'Publish all [browser] explorer files to a github gist',
        icon: 'fab fa-github'
      },
      { action: 'copyFiles',
        title: 'Copy all files to another instance of Remix IDE',
        icon: 'far fa-copy'
      },
      { action: 'uploadFile',
        title: 'Add Local file to the Browser Storage Explorer',
        icon: 'far fa-folder-open'
      },
      { action: 'updateGist',
        title: 'Update the current [gist] explorer',
        icon: 'fab fa-github'
      }
    ]
  // menu items
  this.menuItems = allItems.filter(
    (item) => {
      if (menuItems) return menuItems.find((name) => { return name === item.action })
    }
  )

  self._components = {}
  self._components.registry = localRegistry || globalRegistry
  self._deps = {
    config: self._components.registry.get('config').api,
    editor: self._components.registry.get('editor').api,
    fileManager: self._components.registry.get('filemanager').api
  }

  self.events.register('focus', function (path) {
    self._deps.fileManager.switchFile(path)
  })

  self._components.registry.put({ api: self, name: `fileexplorer/${self.files.type}` })

  // warn if file changed outside of Remix
  function remixdDialog () {
    return yo`<div>This file has been changed outside of Remix IDE.</div>`
  }

  this.files.event.register('fileExternallyChanged', (path, file) => {
    if (self._deps.config.get('currentFile') === path && self._deps.editor.currentContent() && self._deps.editor.currentContent() !== file.content) {
      if (this.files.isReadOnly(path)) return self._deps.editor.setText(file.content)

      modalDialog(path + ' changed', remixdDialog(),
        {
          label: 'Replace by the new content',
          fn: () => {
            self._deps.editor.setText(file.content)
          }
        },
        {
          label: 'Keep the content displayed in Remix',
          fn: () => {}
        }
      )
    }
  })

  // register to event of the file provider
  files.event.register('fileRemoved', fileRemoved)
  files.event.register('fileRenamed', fileRenamed)
  files.event.register('fileRenamedError', fileRenamedError)
  files.event.register('fileAdded', fileAdded)
  files.event.register('folderAdded', folderAdded)

  function fileRenamedError (error) {
    modalDialogCustom.alert(error)
  }

  function fileAdded (filepath) {
    self.ensureRoot(() => {
      var folderpath = filepath.split('/').slice(0, -1).join('/')

      var currentTree = self.treeView.nodeAt(folderpath)
      if (currentTree && self.treeView.isExpanded(folderpath)) {
        self.files.resolveDirectory(folderpath, (error, fileTree) => {
          if (error) console.error(error)
          if (!fileTree) return
          fileTree = normalize(folderpath, fileTree)
          self.treeView.updateNodeFromJSON(folderpath, fileTree, true)
          self.focusElement = self.treeView.labelAt(self.focusPath)
          // TODO: here we update the selected file (it applicable)
          // cause we are refreshing the interface of the whole directory when there's a new file.
          if (self.focusElement && !self.focusElement.classList.contains('bg-secondary')) {
            self.focusElement.classList.add('bg-secondary')
          }
        })
      }
    })
  }

  function folderAdded (folderpath) {
    self.ensureRoot(() => {
      folderpath = folderpath.split('/').slice(0, -1).join('/')
      self.files.resolveDirectory(folderpath, (error, fileTree) => {
        if (error) console.error(error)
        if (!fileTree) return
        fileTree = normalize(folderpath, fileTree)
        self.treeView.updateNodeFromJSON(folderpath, fileTree, true)
      })
    })
  }

  function fileRemoved (filepath) {
    var label = self.treeView.labelAt(filepath)
    if (label && label.parentElement) {
      label.parentElement.removeChild(label)
    }
  }

  function fileRenamed (oldName, newName, isFolder) {
    fileRemoved(oldName)
    fileAdded(newName)
  }

  // make interface and register to nodeClick, leafClick
  self.treeView = new Treeview({
    extractData: function extractData (value, tree, key) {
      var newValue = {}
      // var isReadOnly = false
      var isFile = false
      Object.keys(value).filter(function keep (x) {
        if (x === '/content') isFile = true
        // if (x === '/readOnly') isReadOnly = true
        if (x[0] !== '/') return true
      }).forEach(function (x) { newValue[x] = value[x] })
      return {
        path: (tree || {}).path ? tree.path + '/' + key : key,
        children: isFile ? undefined
          : value instanceof Array ? value.map((item, index) => ({
            key: index, value: item
          })) : value instanceof Object ? Object.keys(value).map(subkey => ({
            key: subkey, value: value[subkey]
          })) : undefined
      }
    },
    formatSelf: function formatSelf (key, data, li) {
      var isRoot = data.path === self.files.type
      return yo`
        <div class="${css.items}">
          <span
            title="${data.path}"
            class="${css.label} ${!isRoot ? css.leaf : ''}"
            data-path="${data.path}"
            style="${isRoot ? 'font-weight:bold;' : ''}"
            onkeydown=${editModeOff}
            onblur=${editModeOff}
          >
            ${key.split('/').pop()}
          </span>
          ${isRoot ? self.renderMenuItems() : ''}
        </div>
      `
    }
  })

  /**
   * Extracts first two folders as a subpath from the path.
   **/
  function extractExternalFolder (path) {
    const firstSlIndex = path.indexOf('/', 1)
    if (firstSlIndex === -1) return ''
    const secondSlIndex = path.indexOf('/', firstSlIndex + 1)
    if (secondSlIndex === -1) return ''
    return path.substring(0, secondSlIndex)
  }

  self.treeView.event.register('nodeRightClick', function (key, data, label, event) {
    if (self.files.readonly) return
    if (key === self.files.type) return
    MENU_HANDLE && MENU_HANDLE.hide(null, true)
    let actions = {}
    const provider = self._deps.fileManager.fileProviderOf(key)
    if (provider.isExternalFolder(key)) {
      actions['Discard changes'] = () => {
        modalDialogCustom.confirm(
          'Discard changes',
          'Are you sure you want to discard all your changes?',
          () => { files.discardChanges(key) },
          () => {}
        )
      }
    } else {
      const folderPath = extractExternalFolder(key)
      if (folderPath === 'browser/gists') {
        actions['Push changes to gist'] = () => {
          const id = key.substr(key.lastIndexOf('/') + 1, key.length - 1)
          modalDialogCustom.confirm(
            'Push back to Gist',
            'Are you sure you want to push all your changes back to Gist?',
            () => { self.toGist(id) },
            () => {}
          )
        }
      }
      actions['Create File'] = () => self.createNewFile(key)
      actions['Create Folder'] = () => self.createNewFolder(key)

      actions['Rename'] = () => {
        if (self.files.isReadOnly(key)) { return tooltip('cannot rename folder. ' + self.files.type + ' is a read only explorer') }
        var name = label.querySelector('span[data-path="' + key + '"]')
        if (name) editModeOn(name)
      }
    }
    actions['Delete'] = () => {
      if (self.files.isReadOnly(key)) { return tooltip('cannot delete folder. ' + self.files.type + ' is a read only explorer') }
      modalDialogCustom.confirm('Confirm to delete a folder', 'Are you sure you want to delete this folder?',
        () => {
          if (!files.remove(key)) tooltip(`failed to remove ${key}. Make sure the directory is empty before removing it.`)
        }, () => {})
    }
    MENU_HANDLE = contextMenu(event, actions)
  })

  self.treeView.event.register('leafRightClick', function (key, data, label, event) {
    if (key === self.files.type) return
    MENU_HANDLE && MENU_HANDLE.hide(null, true)
    let actions = {}
    const provider = self._deps.fileManager.fileProviderOf(key)
    if (!provider.isExternalFolder(key)) {
      actions['Create Folder'] = () => self.createNewFolder(self._deps.fileManager.extractPathOf(key))
      actions['Rename'] = () => {
        if (self.files.isReadOnly(key)) { return tooltip('cannot rename file. ' + self.files.type + ' is a read only explorer') }
        var name = label.querySelector('span[data-path="' + key + '"]')
        if (name) editModeOn(name)
      }
      actions['Delete'] = () => {
        if (self.files.isReadOnly(key)) { return tooltip('cannot delete file. ' + self.files.type + ' is a read only explorer') }
        modalDialogCustom.confirm(
          'Delete a file', 'Are you sure you want to delete this file?',
          () => { files.remove(key) },
          () => {}
        )
      }
    }
    MENU_HANDLE = contextMenu(event, actions)
  })

  self.treeView.event.register('leafClick', function (key, data, label) {
    self.events.trigger('focus', [key])
  })

  self.treeView.event.register('nodeClick', function (path, childrenContainer) {
    if (!childrenContainer) return
    if (childrenContainer.style.display === 'none') return
    self.updatePath(path)
  })

  // register to main app, trigger when the current file in the editor changed
  self._deps.fileManager.events.on('currentFileChanged', (newFile) => {
    const provider = self._deps.fileManager.fileProviderOf(newFile)
    if (self.focusElement && self.focusPath !== newFile) {
      self.focusElement.classList.remove('bg-secondary')
      self.focusElement = null
      self.focusPath = null
    }
    if (provider && (provider.type === files.type)) {
      self.focusElement = self.treeView.labelAt(newFile)
      if (self.focusElement) {
        self.focusElement.classList.add('bg-secondary')
        self.focusPath = newFile
      }
    }
  })

  self._deps.fileManager.events.on('noFileSelected', () => {
    if (self.focusElement) {
      self.focusElement.classList.remove('bg-secondary')
      self.focusElement = null
      self.focusPath = null
    }
  })

  var textUnderEdit = null

  function selectElementContents (el) {
    var range = document.createRange()
    range.selectNodeContents(el)
    var sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function editModeOn (label) {
    textUnderEdit = label.innerText
    label.setAttribute('contenteditable', true)
    label.classList.add('bg-light')
    label.focus()
    selectElementContents(label)
  }

  function editModeOff (event) {
    var label = this
    function rename () {
      var newPath = label.dataset.path
      newPath = newPath.split('/')
      newPath[newPath.length - 1] = label.innerText
      newPath = newPath.join('/')
      if (label.innerText === '') {
        modalDialogCustom.alert('File name cannot be empty')
        label.innerText = textUnderEdit
      } else if (helper.checkSpecialChars(label.innerText)) {
        modalDialogCustom.alert('Special characters are not allowed')
        label.innerText = textUnderEdit
      } else {
        files.exists(newPath, (error, exist) => {
          if (error) return modalDialogCustom.alert('Unexpected error while renaming: ' + error)
          if (!exist) {
            files.rename(label.dataset.path, newPath, isFolder)
          } else {
            modalDialogCustom.alert('File already exists.')
            label.innerText = textUnderEdit
          }
        })
      }
    }

    if (event.which === 13) event.preventDefault()
    if ((event.type === 'blur' || event.which === 13) && label.getAttribute('contenteditable')) {
      var isFolder = label.className.indexOf('folder') !== -1
      var save = textUnderEdit !== label.innerText
      if (save) {
        modalDialogCustom.confirm('Confirm to rename a file', 'Are you sure you want to rename this file?', () => { rename() }, () => { label.innerText = textUnderEdit })
      }
      label.removeAttribute('contenteditable')
      label.classList.remove('bg-light')
    }
  }
}

fileExplorer.prototype.updatePath = function (path) {
  this.files.resolveDirectory(path, (error, fileTree) => {
    if (error) console.error(error)
    if (!fileTree) return
    var newTree = normalize(path, fileTree)
    this.treeView.updateNodeFromJSON(path, newTree, true)
  })
}

fileExplorer.prototype.hide = function () {
  if (this.container) this.container.style.display = 'none'
}

fileExplorer.prototype.show = function () {
  if (this.container) this.container.style.display = 'block'
}

fileExplorer.prototype.init = function () {
  this.container = yo`<div></div>`
  return this.container
}

fileExplorer.prototype.publishToGist = function () {
  modalDialogCustom.confirm(
    'Create a public gist',
    'Are you sure you want to publish all your files in browser directory anonymously as a public gist on github.com? Note: this will not include directories.',
    () => { this.toGist() }
  )
}

fileExplorer.prototype.uploadFile = function (event) {
  // TODO The file explorer is merely a view on the current state of
  // the files module. Please ask the user here if they want to overwrite
  // a file and then just use `files.add`. The file explorer will
  // pick that up via the 'fileAdded' event from the files module.

  let self = this

  ;[...event.target.files].forEach((file) => {
    let files = this.files
    function loadFile () {
      var fileReader = new FileReader()
      fileReader.onload = function (event) {
        if (helper.checkSpecialChars(file.name)) {
          modalDialogCustom.alert('Special characters are not allowed')
          return
        }
        var success = files.set(name, event.target.result)
        if (!success) {
          modalDialogCustom.alert('Failed to create file ' + name)
        } else {
          self.events.trigger('focus', [name])
        }
      }
      fileReader.readAsText(file)
    }
    var name = files.type + '/' + file.name
    files.exists(name, (error, exist) => {
      if (error) console.log(error)
      if (!exist) {
        loadFile()
      } else {
        modalDialogCustom.confirm('Confirm overwrite', `The file ${name} already exists! Would you like to overwrite it?`, () => { loadFile() })
      }
    })
  })
}

fileExplorer.prototype.toGist = function (id) {
  let proccedResult = function (error, data) {
    if (error) {
      modalDialogCustom.alert('Failed to manage gist: ' + error)
      console.log('Failed to manage gist: ' + error)
    } else {
      if (data.html_url) {
        modalDialogCustom.confirm('Gist is ready', `The gist is at ${data.html_url}. Would you like to open it in a new window?`, () => {
          window.open(data.html_url, '_blank')
        })
      } else {
        modalDialogCustom.alert(data.message + ' ' + data.documentation_url + ' ' + JSON.stringify(data.errors, null, '\t'))
      }
    }
  }

  /**
   * This function is to get the original content of given gist
   * @params id is the gist id to fetch
   */
  async function getOriginalFiles (id) {
    if (!id) {
      return []
    }

    const url = `https://api.github.com/gists/${id}`
    const res = await fetch(url)
    const data = await res.json()
    return data.files || []
  }

  this.packageFiles(this.files, 'browser/gists/' + id, (error, packaged) => {
    if (error) {
      console.log(error)
      modalDialogCustom.alert('Failed to create gist: ' + error)
    } else {
      // check for token
      var tokenAccess = this._deps.config.get('settings/gist-access-token')
      if (!tokenAccess) {
        modalDialogCustom.alert(
          'Remix requires an access token (which includes gists creation permission). Please go to the settings tab to create one.'
        )
      } else {
        const description = 'Created using remix-ide: Realtime Ethereum Contract Compiler and Runtime. \n Load this file by pasting this gists URL or ID at https://remix.ethereum.org/#version=' +
          queryParams.get().version + '&optimize=' + queryParams.get().optimize + '&gist='
        const gists = new Gists({ token: tokenAccess })

        if (id) {
          const originalFileList = getOriginalFiles(id)
          // Telling the GIST API to remove files
          const updatedFileList = Object.keys(packaged)
          const allItems = Object.keys(originalFileList)
            .filter(fileName => updatedFileList.indexOf(fileName) === -1)
            .reduce((acc, deleteFileName) => ({
              ...acc,
              [deleteFileName]: null
            }), originalFileList)
          // adding new files
          updatedFileList.forEach((file) => {
            const _items = file.split('/')
            const _fileName = _items[_items.length - 1]
            allItems[_fileName] = packaged[file]
          })

          tooltip('Saving gist (' + id + ') ...')
          gists.edit({
            description: description,
            public: true,
            files: allItems,
            id: id
          }, (error, result) => {
            proccedResult(error, result)
            if (!error) {
              for (const key in allItems) {
                if (allItems[key] === null) delete allItems[key]
              }
            }
          })
        } else {
          // id is not existing, need to create a new gist
          tooltip('Creating a new gist ...')
          gists.create({
            description: description,
            public: true,
            files: packaged
          }, (error, result) => {
            proccedResult(error, result)
          })
        }
      }
    }
  })
}

// return all the files, except the temporary/readonly ones..
fileExplorer.prototype.packageFiles = function (filesProvider, directory, callback) {
  var ret = {}
  filesProvider.resolveDirectory(directory, (error, files) => {
    if (error) callback(error)
    else {
      async.eachSeries(Object.keys(files), (path, cb) => {
        filesProvider.get(path, (error, content) => {
          if (error) return cb(error)
          if (/^\s+$/.test(content) || !content.length) {
            content = '// this line is added to create a gist. Empty file is not allowed.'
          }
          ret[path] = { content }
          cb()
        })
      }, (error) => {
        callback(error, ret)
      })
    }
  })
}

// ------------------ copy files --------------
fileExplorer.prototype.copyFiles = function () {
  let self = this
  modalDialogCustom.prompt(
    'Copy files from browser explorer',
    'To which other remix-ide instance do you want to copy over all files?',
    'https://remix.ethereum.org',
    (target) => {
      doCopy(target)
    }
  )
  function doCopy (target) {
    // package only files from the browser storage.
    self.packageFiles(self.files, '/', (error, packaged) => {
      if (error) {
        console.log(error)
      } else {
        let iframe = yo`
          <iframe src=${target} style='display:none;'></iframe>
        `
        iframe.onload = function () {
          iframe.contentWindow.postMessage(['loadFiles', packaged], '*')
          tooltip('Files copied successfully.')
        }
        document.querySelector('body').appendChild(iframe)
      }
    })
  }
}

fileExplorer.prototype.createNewFile = function (parentFolder) {
  let self = this
  modalDialogCustom.prompt('Create new file', 'File Name (e.g Untitled.sol)', 'Untitled.sol', (input) => {
    helper.createNonClashingName(input, self.files, (error, newName) => {
      if (error) return modalDialogCustom.alert('Failed to create file ' + newName + ' ' + error)
      const currentPath = !parentFolder ? self._deps.fileManager.currentPath() : parentFolder
      newName = currentPath ? currentPath + '/' + newName : self.files.type + '/' + newName

      if (!self.files.set(newName, '')) {
        modalDialogCustom.alert('Failed to create file ' + newName)
      } else {
        self._deps.fileManager.switchFile(newName)
        if (newName.includes('_test.sol')) {
          self.event.trigger('newTestFileCreated', [newName])
        }
      }
    })
  }, null, true)
}

fileExplorer.prototype.createNewFolder = function (parentFolder) {
  let self = this
  modalDialogCustom.prompt('Create new folder', '', '', (input) => {
    const currentPath = !parentFolder ? self._deps.fileManager.currentPath() : parentFolder
    let newName = currentPath ? currentPath + '/' + input : self.files.type + '/' + input

    newName = newName + '/'
    if (!self.files.set(newName, '')) {
      modalDialogCustom.alert('Failed to create folder ' + newName)
    }
  }, null, true)
}

fileExplorer.prototype.renderMenuItems = function () {
  let items = ''
  if (this.menuItems) {
    items = this.menuItems.map(({action, title, icon}) => {
      if (action === 'uploadFile') {
        return yo`
          <label class="${icon} ${css.newFile}"  title="${title}">
            <input type="file" onchange=${(event) => {
              event.stopPropagation()
              this.uploadFile(event)
            }} multiple />
          </label>
        `
      } else {
        return yo`
        <span onclick=${(event) => { event.stopPropagation(); this[ action ]() }} class="newFile ${icon} ${css.newFile}" title=${title}></span>
        `
      }
    })
  }
  return yo`<span class=" ${css.menu}">${items}</span>`
}

fileExplorer.prototype.ensureRoot = function (cb) {
  cb = cb || (() => {})
  var self = this
  if (self.element) return cb()
  const root = {}
  root[this.files.type] = {}
  var element = self.treeView.render(root, false)
  element.classList.add(css.fileexplorer)
  element.events = self.events
  element.api = self.api
  self.container.appendChild(element)
  self.element = element
  if (cb) cb()
  self.treeView.expand(self.files.type)
}

function normalize (path, filesList) {
  var prefix = path.split('/')[0]
  var newList = {}
  Object.keys(filesList).forEach(key => {
    newList[prefix + '/' + key] = filesList[key].isDirectory ? {} : { '/content': true }
  })
  return newList
}

module.exports = fileExplorer
