import { createVanillaModal, alert, closeAll, confirm, configDefaultOptions, getDefaultOptions, getModals } from '/dist/vanilla-modals.js';

const scenario = new URLSearchParams(window.location.search).get('scenario') || 'basic';
const result = document.querySelector('#result');
const events = [];

/**
 * Tracks an event and updates counters in fixture UI.
 *
 * @param {string} name
 * @returns {void}
 */
function track(name) {
    events.push(name);
    const counter = document.querySelector('#event-count');
    counter.textContent = `events: ${events.length}`;
}

/**
 * Creates baseline modal instance for fixture controls.
 *
 * @returns {import('/dist/vanilla-modals.js').VanillaModal}
 */
function createMainModal() {
    return createVanillaModal({
        id: 'e2e-main',
        title: 'Fixture modal',
        message: 'Fixture message',
        buttons: [
            { id: 'cancel', label: 'Cancel' },
            {
                id: 'ok',
                label: 'OK',
                action: () => {
                    result.textContent = 'ok';
                }
            }
        ]
    });
}

let modal = createMainModal();
modal.on('show', () => track('show'));
modal.on('hidden', () => track('hidden'));

if (scenario === 'defaults') {
    configDefaultOptions({ closable: false });
    const defaults = getDefaultOptions();
    result.textContent = `closable-default:${defaults.closable}`;
}

document.querySelector('#open').addEventListener('click', () => {
    modal.open();
});

document.querySelector('#close').addEventListener('click', () => {
    modal.close('fixture-close');
});

document.querySelector('#alert').addEventListener('click', () => {
    alert('Alert from fixture', (ok) => {
        result.textContent = `alert:${ok}`;
    });
});

document.querySelector('#confirm').addEventListener('click', () => {
    confirm('Confirm from fixture', (ok) => {
        result.textContent = `confirm:${ok}`;
    });
});

window.__e2e = {
    getEvents() {
        return [...events];
    },
    getState() {
        return {
            scenario,
            modalCount: getModals().length,
            result: result.textContent || ''
        };
    },
    reset() {
        closeAll('fixture-reset');
        modal.destroy();
        modal = createMainModal();
    }
};

document.querySelector('#scenario-label').textContent = `scenario: ${scenario}`;
document.body.dataset.ready = 'true';
