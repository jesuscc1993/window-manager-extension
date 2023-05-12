const { storage, tabs, windows } = chrome;

const state = { settings: {}, domain: '' };

const newWindowForm = $('#open-new-window');

const initialize = () => {
  tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    state.domain = activeTab.url.includes('://')
      ? activeTab.url.split(/\/+/g)[1]
      : undefined;

    if (state.domain) {
      newWindowForm.find('[name="url"]').val(activeTab.url);
      newWindowForm.submit(openNewWindow);

      storage.sync.get(['settings'], ({ settings }) => {
        state.settings = settings;

        if (settings) {
          const newWindowFormData = settings.newWindowFormData[state.domain];
          if (newWindowFormData) {
            for (const key in newWindowFormData) {
              const value = newWindowFormData[key];
              newWindowForm.find(`[name="${key}"]`).val(value);
            }

            if (newWindowFormData.asPopup) {
              newWindowForm.find(`[name="asPopup"]`).attr('checked', 'checked');
            }

            if (newWindowFormData.replaceWindow) {
              newWindowForm
                .find(`[name="replaceWindow"]`)
                .attr('checked', 'checked');
            }
          }
        }
      });
    }
  });
};

const openNewWindow = () => {
  const { domain, settings } = state;
  const { type, url, ...formData } = getFormData($('#open-new-window'));
  const height = stringToNumber(formData.height);
  const left = stringToNumber(formData.left);
  const top = stringToNumber(formData.top);
  const width = stringToNumber(formData.width);
  const replaceWindow = stringToBool(formData.replaceWindow);

  tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    storage.sync.set(
      {
        settings: {
          ...settings,
          newWindowFormData: {
            ...((settings && settings.formData) || {}),
            [domain]: formData,
          },
        },
      },
      () => {
        windows.create({
          height,
          left,
          top,
          type,
          url,
          width,
          focused: true,
        });

        if (replaceWindow) {
          tabs.remove(activeTab.id);
        }

        window.close();
      }
    );
  });
};

const getFormData = (formElement) => {
  return formElement
    .serializeArray()
    .reduce(
      (formData, { name, value }) => ({ ...formData, [name]: value }),
      {}
    );
};

const stringToNumber = (text) => {
  const value = text.length ? parseInt(text, 10) : undefined;
  return isNaN(value) ? undefined : value;
};

const stringToBool = (text) => {
  return text == 'on';
};

initialize();
