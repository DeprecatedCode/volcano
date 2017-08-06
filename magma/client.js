const text = {
  untitledModule: 'Untitled Module'
};

const store = {
  has: key => key in localStorage,
  get: key => JSON.parse(localStorage.getItem(key)),
  remove: key => localStorage.removeItem(key),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value))
};

const get = {
  json: (...url) => fetch(url.join('/'))
    .then(response => response.json())
};

const immediate = fn => {
  fn();
  return fn;
}

const element = domElement => ({
  div(...classes) {
    return this.child('div', classes);
  },
  header(...classes) {
    return this.child('h1', classes);
  },
  paragraph(...classes) {
    return this.child('p', classes);
  },
  span(...classes) {
    return this.child('span', classes);
  },
  input(...classes) {
    return this.child('input', classes);
  },
  textarea(...classes) {
    return this.child('textarea', classes);
  },
  child: (tagname, classes) => {
    const child = document.createElement(tagname);
    classes.forEach(name => child.classList.add(name));
    domElement.appendChild(child);
    return element(child);
  },
  clear() {
    domElement.innerText = '';
    return this;
  },
  disabled(disabled) {
    domElement.disabled = disabled;
    return this;
  },
  text(text) {
    domElement.appendChild(document.createTextNode(text))
    return this;
  },
  html(html) {
    domElement.innerHTML = html
    return this;
  },
  click(fn) {
    domElement.addEventListener('click', fn);
    return this;
  },
  placeholder: placeholder => domElement.setAttribute('placeholder', placeholder),
  value: value => domElement.setAttribute('value', value),
  get renderModule() {
    return module => {
      const moduleClass = 'magma-module-' + module.uniqueId.replace(/\./g, '-');
      const moduleElement = this.div('magma-module', moduleClass);
      const controls = moduleElement.div('magma-controls');
      controls.span('magma-unique-id').text(module.uniqueId);
      controls.span('magma-separator').html('&bull;');
      controls.span('magma-title').text(module.title || text.untitledModule);
      controls.click(() => updateInspectedModule(module));
    };
  },
  get renderField() {
    return field => {
      const { module, title, key, type, itemType, editable, placeholder } = field;
      this.div('magma-inspect--field-title').text(title);

      if (field.type === 'string') {
        const input = this.input('magma-field');
        if (editable === false) {
          input.disabled(true);
        }
        if (placeholder) {
          input.placeholder(placeholder);
        }
        if (key in module) {
          input.value(module[key]);
        }
        return;
      }

      if (field.type === 'script') {
        const textarea = this.textarea('magma-field');
        if (editable === false) {
          textarea.disabled(true);
        }
        if (key in module) {
          textarea.value(module[key]);
        }
        return;
      }

      console.log(field);
    };
  }
});

const loadModule = module =>
  get.json('module', module.uniqueId);

const magmaRootElement = element(document.body).div('magma-root');
const magmaInspectElement = element(document.body).div('magma-inspect');

const mainPanel = () => {
  const inspect = magmaInspectElement;
  inspect.clear();
  inspect.header().text('Magma Inspector');
  inspect.paragraph().text('Select a module to inspect.');
};

const inspectModule = module => {
  const inspect = magmaInspectElement;
  inspect.clear();
  inspect.header().text('Module Details');
  inspect.div('magma-button', 'magma-button--close')
    .html('&times;')
    .click(clearInspectedModule);
  inspect.div('magma-button', 'magma-button--save')
    .html('Save')
    .click(clearInspectedModule);
  inspect.renderField({ module, title: 'Unique Id',   key: 'uniqueId',    type: 'string', editable: false });
  inspect.renderField({ module, title: 'Title',       key: 'title',       type: 'string', placeholder: text.untitledModule });
  inspect.renderField({ module, title: 'Events',      key: 'events',      type: 'array', itemType: 'module' });
  inspect.renderField({ module, title: 'Render',      key: 'render',      type: 'script' });
  inspect.renderField({ module, title: 'Settings',    key: 'settings',    type: 'object' });
  inspect.renderField({ module, title: 'Item Format', key: 'itemFormat',  type: 'object' });
  inspect.renderField({ module, title: 'Items',       key: 'items',       type: 'array', itemType: 'object' });
};

if (store.has('default')) {
  loadModule(store.get('default'))
    .then(magmaRootElement.renderModule);
}

else {
  get.json('default').then(defaultModule => {
    console.log(defaultModule);
    store.set('default', defaultModule);
    loadModule(defaultModule)
      .then(magmaRootElement.renderModule);
  });
}

document.addEventListener('keypress', event => {
  if (event.altKey && event.shiftKey && event.code === 'KeyE') {
    updateMagmaEditModeState(true);
  }
});

const updateMagmaEditModeState = immediate(toggle => {
  const key = 'magma:editMode';
  let editMode = store.has(key) ? store.get(key) === 'on' : false;
  if (toggle) {
    editMode = !editMode;
    store.set(key, editMode ? 'on' : 'off');
  }
  document.body.classList.toggle('magma-edit', editMode);
});

const moduleKey = module => 'magma:module:' + module.uniqueId;

const clearInspectedModule = () => {
  const key = 'magma:inspectedModule';
  store.remove(key);
  mainPanel();
};

const updateInspectedModule = immediate(module => {
  const key = 'magma:inspectedModule';
  let inspectedModuleKey = store.has(key) ? store.get(key) : null;

  if (module) {
    inspectedModuleKey = moduleKey(module);
  }

  let inspectedModule = store.has(inspectedModuleKey) ? store.get(inspectedModuleKey) : null;
  if (module) {
    inspectedModule = module;
    store.set(inspectedModuleKey, inspectedModule);
    store.set(key, inspectedModuleKey);
  }
  if (inspectedModule) {
    inspectModule(inspectedModule);
  }
  else {
    mainPanel();
  }
});
