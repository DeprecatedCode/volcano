const storage = localStorage;
const root = document.createElement('div');

const get = {
  text: url => fetch(url)
    .then(response => response.text())
    .catch(renderError)
};

if (storage.magmaDefault) {
  render(storage.magmaDefault);
}

else {
  renderLoading();
  get.text('.magma/default')
    .then(defaultComponent => {
      console.log(defaultComponent);
    });
}

function renderError(error) {
  root.innerHTML = 'Error' + (error ? ': ' + error : '');
}

function renderLoading() {
  root.innerHTML = 'Loading...';
}

function render(html) {
  root.innerHTML = html;
}
