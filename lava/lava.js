function lava(element, path) {
  var modulePath = path.split(':')[0];
  lava.get('/.lava/resources' + modulePath)
    .then(function (resource) {
      lava.loadModule(element, modulePath, path, resource);
    })
    .catch(function (error) {
      console.error(error);
      lava.renderError(element, 'Unable to load resource at ' + path + '.');
    });
}

lava.action = function (sourceModule, action, destinationModule, destinationElement) {
  var data = { source: sourceModule, action: action };

  if (destinationElement.hasAttribute('lava-state')) {
    data.state = JSON.parse(destinationElement.getAttribute('lava-state'));
  }

  lava.get('/.lava/resources' + destinationModule)
    .then(function (resource) {
      lava.post('/.lava/' + resource.port + '/.event', data)
        .then(function (response) {
          if (response.state) {
            lava.setState(destinationElement, response.state);
          }
        })
        .catch(function (error) {
          console.error(error);
          lava.renderError(destinationElement, 'Unable to process event ' +
            sourceModule + ':' + action + ' for module ' + destinationModule);
        });
    })
    .catch(function (error) {
      console.error(error);
      lava.renderError(element, 'Unable to load resource at ' + path + '.');
    });
};

lava.applyStateDifference = function (module, previousState, state) {
  if (!module.attributes.state) {
    return;
  }
  var key = module.attributes.state;
  if (previousState[key] !== state[key]) {
    lava(module.element, module.path);
  }
};

lava.childComponent = function (parentElement) {
  return function (_, path) {
    var id = Math.random().toString(36).substr(2) + ':' + path;
    var childElement = document.createElement('div');
    var attributes = {};
    var parsed = path.split(' ');
    path = parsed.shift();
    parsed.forEach(function (item) {
      var attribute = item.split(':');
      attributes[attribute[0]] = attribute[1];
    });

    if (Object.keys(attributes).length > 0) {
      childElement.setAttribute('lava-attributes', JSON.stringify(attributes));
    }

    if (!parentElement.getLavaChildren) {
      var children = [];
      parentElement.getLavaChildren = function () {
        return children;
      }
    }

    parentElement.getLavaChildren().push({
      attributes: attributes,
      element: childElement,
      path: path
    });

    setTimeout(function () {
      var placeholderElement = document.getElementById(id);
      placeholderElement.replaceWith(childElement);
      lava(childElement, path);
    });

    return '<div id="' + id + '"></div>';
  };
};

lava.click = function (event) {
  var element = event.target;

  if (!element.hasAttribute('lava-click')) {
    return;
  }

  var action = element.getAttribute('lava-click');  
  
  while (element && !element.hasAttribute('lava-module')) {
    element = element.parentElement;
  }
  
  if (!element) {
    throw new Error('No lava source module found for action ' + action);
  }
  
  var sourceModule = element.getAttribute('lava-module');
  var destination = element.parentElement;
  
  while (destination && (!destination.hasAttribute('lava-events') || destination.getAttribute('lava-events').split(',').indexOf(sourceModule) === -1)) {
    destination = destination.parentElement;
  }

  if (!destination) {
    throw new Error('No lava destination module found for action ' + action);
  }

  var destinationModule = destination.getAttribute('lava-module');

  lava.action(sourceModule, action, destinationModule, destination);
};

lava.get = function (url) {
  return new Promise(function (resolve, reject) {
    fetch(url).then(function (response) {
      if (response.status === 200) {
        response.json().then(resolve);
      }
      else {
        reject();
      }
    });
  });
};

lava.loadModule = function (element, modulePath, path, resource) {
  var attributes = element.hasAttribute('lava-attributes') ?
    JSON.parse(element.getAttribute('lava-attributes')) : {};

  var relativePath = path.split(':')[1] || '/';
  var promise, url = '/.lava/' + resource.port + relativePath;

  if (attributes.state) {
    var parent = element.parentElement;
    while (parent && !parent.hasAttribute('lava-state')) {
      parent = parent.parentElement;
    }
    if (!parent) {
      throw new Error('No lava parent module found for state');
    }
    var state = JSON.parse(parent.getAttribute('lava-state'));
    promise = lava.post(url, { state: state[attributes.state] });
  }

  else {
    promise = lava.get(url);
  }

  promise.then(function (module) {
    element.setAttribute('lava-module', modulePath);
    element.classList.add(modulePath.substr(1).replace(/\//g, '--'));
    if (module.events) {
      element.setAttribute('lava-events', module.events.join(','));
    }
    if (module.state) {
      element.setAttribute('lava-state', JSON.stringify(module.state));
    }
    element.innerHTML = module.content.replace(/@lava\(([^)]*)\)/g, lava.childComponent(element));
  })
  .catch(function (error) {
    console.error(error);
    lava.renderError(element, 'Unable to load module at ' + path + '.');
  });
};

lava.post = function (url, state) {
  return new Promise(function (resolve, reject) {
    var options = {
      method: 'POST',
      body: JSON.stringify(state)
    };

    fetch(url, options).then(function (response) {
      if (response.status === 200) {
        response.json().then(resolve);
      }
      else {
        reject();
      }
    });
  });
};

lava.renderError = function (element, message) {
  element.innerHTML = '<div class="lava--error"><b>Error:</b> ' + message + '</div>';
};

lava.setState = function (element, state) {
  var previousState = JSON.parse(element.getAttribute('lava-state'));
  element.setAttribute('lava-state', JSON.stringify(state));
  if (element.getLavaChildren) {
    element.getLavaChildren().forEach(function (child) {
      lava.applyStateDifference(child, previousState, state);
    });
  }
};
