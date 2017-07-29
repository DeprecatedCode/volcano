function lava(element, path) {
  var modulePath = path.split(':')[0];
  lava.get('/.lava/resources' + modulePath)
    .then(function (resource) {
      lava.loadComponent(element, path, resource);
    })
    .catch(function () {
      lava.renderError(element, 'Unable to load resource at ' + path + '.');
    });
}

lava.childComponent = function (_, path) {
  var id = Math.random().toString(36).substr(2) + ':' + path;
  var childElement = document.createElement('div');
  var modulePath = path.split(':')[0];
  childElement.classList.add(modulePath.substr(1).replace(/\//g, '--'));
  setTimeout(function () {
    var placeholderElement = document.getElementById(id);
    placeholderElement.replaceWith(childElement);
    lava(childElement, path);
  });
  return '<div id="' + id + '"></div>';
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

lava.loadComponent = function (element, path, resource) {
  lava.get('/.lava/' + resource.port + '/' + path.replace(resource.url, ''))
    .then(function (component) {
      element.innerHTML = component.content.replace(/@lava\(([^)]*)\)/g, lava.childComponent);
    })
    .catch(function () {
      lava.renderError(element, 'Unable to load component at ' + path + '.');
    });
};

lava.renderError = function (element, message) {
  element.innerHTML = '<div class="lava--error"><b>Error:</b> ' + message + '</div>';
};
