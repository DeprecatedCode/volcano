const text = {
  untitledModule: 'Untitled Module'
};

const ON = 'on';
const OFF = 'off';

const panel = {};

const plural = (count, of) =>
  `${count} ${of}${count === 1 ? '' : 's'}`;

const store = {
  has: key => key in localStorage,
  get: key => JSON.parse(localStorage.getItem(key)),
  getString: key => localStorage.getItem(key),
  remove: key => localStorage.removeItem(key),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  setString: (key, value) => localStorage.setItem(key, value)
};

const get = {
  json: (...url) => fetch(url.join('/'))
    .then(response => response.json())
};

const the = it => () => it;

const required = value => {
  if (!value) {
    throw new Error('Missing required value');
  }
  return value;
};

Function.prototype.with = function (...args) {
  return () => this(...args);
};

Function.prototype.then = function (next) {
  return (...args) => this(...args).then(next);
};

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
  addClass(...classes) {
    classes.forEach(name => domElement.classList.add(name));
    return this;
  },
  child: (tagname, classes) => {
    const child = document.createElement(tagname);
    const result = element(child);
    domElement.appendChild(child);
    result.addClass(...classes);
    return result;
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
      controls.click(updateInspectedModule.with(module));
    };
  },
  get renderField() {
    return field => {
      const { module, title, key, type, itemType, editable, placeholder } = field;
      this.div('magma-inspect--field-title').text(title);

      if (type === 'string') {
        const input = this.input('magma-field');
        if (!editable) {
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

      if (type === 'script') {
        const textarea = this.textarea('magma-field');
        if (!editable) {
          textarea.disabled(true);
        }
        if (key in module) {
          textarea.value(module[key]);
        }
        return;
      }

      if (type === 'array') {
        const array = this.div('magma-field');
        if (!editable) {
          array.addClass('disabled');
        }

        if (!(key in module)) {
          module[key] = [];
        }

        const count = array.div('magma-inspect--field-title');
        const updateCount = () =>
          count.text(plural(module[key].length, itemType));
        updateCount();

        const newItem = array.div('new-item');
        newItem.div('magma-button').text(`Add ${itemType}`);
      }

      console.log(field);
    };
  }
});

const loadModule = module =>
  get.json('module', required(module.uniqueId));

const createModule = () =>
  get.json('module', 'new');

const magmaRootElement = element(document.body).div('magma-root');
const magmaInspectElement = element(document.body).div('magma-inspect');

document.addEventListener('keypress', event => {
  if (event.altKey && event.shiftKey && event.code === 'KeyE') {
    updateMagmaEditModeState(true);
  }
});

const updateMagmaEditModeState = toggle => {
  const key = 'magma:editMode';
  let editMode = store.has(key) ? store.get(key) === ON : false;
  if (toggle) {
    editMode = !editMode;
    store.set(key, editMode ? ON : OFF);
  }
  document.body.classList.toggle('magma-edit', editMode);
};

const moduleKey = module => 'magma:module:' + required(module.uniqueId);

const clearInspectedModule = () => {
  const key = 'magma:inspectedModule';
  store.remove(key);
  panel.main();
};

const updateInspectedModule = module => {
  const key = 'magma:inspectedModule';
  let inspectedModuleKey = store.has(key) ? store.getString(key) : null;

  if (module) {
    inspectedModuleKey = moduleKey(module);
  }

  let inspectedModule = store.has(inspectedModuleKey) ? store.get(inspectedModuleKey) : null;
  if (module) {
    inspectedModule = module;
    store.set(inspectedModuleKey, inspectedModule);
    store.setString(key, inspectedModuleKey);
  }
  if (inspectedModule) {
    panel.inspectModule(inspectedModule);
  }
  else {
    panel.main();
  }
};

panel.main = () => {
  const inspect = magmaInspectElement;
  inspect.clear();
  inspect.header().text('Magma Inspector');
  inspect.paragraph().text('Select a module to inspect.');
  inspect.div('magma-button')
    .text('Create New Module')
    .click(createModule.then(updateInspectedModule));
};

panel.inspectModule = module => {
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

const renderModuleAsRoot = loadModule.then(magmaRootElement.renderModule);

if (store.has('default')) {
  renderModuleAsRoot(store.get('default'));
}

else {
  get.json('default').then(defaultModule => {
    store.set('default', defaultModule);
    renderModuleAsRoot(defaultModule);
  });
}

updateMagmaEditModeState();

updateInspectedModule();
