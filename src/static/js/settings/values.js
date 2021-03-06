import * as storage from "../storage";
import { getObjProp } from "../utils";
import * as url from "../url";

const STORAGE_KEY = "settings";

const settingsTypes = {
    compact: Boolean,
    host: String,
    port: Number,
    webAppName: String,
    domain: String,
    queryType: new Set(["similar", "related"]),
    seed: String,
    keepQueryTypeInView: Boolean,
    keepSeedInView: Boolean,
    tabularShowHiddenNodes: Boolean
};

// List of settings that cannot be saved to local storage, but can be set explicitly
// (f.e. URL params).
const unsaveableSettings = new Set([]);

// defaults are assigned here
const settings = {
    compact: false,
    host: "",
    port: +location.port || 57772,
    webAppName: "EntityBrowser",
    domain: "1",
    queryType: "related",
    seed: "crew",
    keepQueryTypeInView: true,
    keepSeedInView: false,
    tabularShowHiddenNodes: false,
    tabularColumns: [
        {
            label: "ID",
            property: ["id"]
        },
        {
            label: "Type",
            property: ["edgeType"],
            class: true
        },
        {
            label: "Label",
            property: ["label"]
        },
        {
            label: "Score",
            property: ["entities", 0, "score"]
        },
        {
            label: "Spread",
            property: ["entities", 0, "spread"]
        },
        {
            label: "Frequency",
            property: ["entities", 0, "frequency"]
        },
        {
            label: "Parent",
            property: ["parent", "label"],
            default: "root"
        }
    ]
};
let changes = [];

let initialStorage = storage.load(STORAGE_KEY);
for (let option in initialStorage) {
    settings[option] = initialStorage[option];
}

/**
 * This function "applies" settings so that getChanges() will return empty array until
 */
export function applyChanges () {
    changes = [];
}

/**
 * @returns {string[]} of changed keys.
 */
export function getChanges () {
    return changes;
}

export function getOption (opt) {
    return settings[opt];
}

export function setOption (options, value) {
    let opts = settings,
        opt = options;
    if (options instanceof Array) {
        opts = getObjProp(settings, options.slice(0, -1));
        opt = options[options.length - 1];
    }
    opts[opt] = value;
    changes.push([options, value]);
    saveSettings();
}

let preservedToolbarElement = null,
    querySettingElement = null,
    seedSettingElement = null,
    uiState = null,
    lastApply = "";
export function applyFixedClasses () {
    let qt = !uiState.settingsToggled && settings["keepQueryTypeInView"],
        s = !uiState.settingsToggled && settings["keepSeedInView"],
        queryParent = qt ? preservedToolbarElement : querySettingElement,
        seedParent = s ? preservedToolbarElement : seedSettingElement;
    if (`${ qt }|${ s }` === lastApply)
        return;
    lastApply = `${ qt }|${ s }`;
    queryParent.appendChild(document.getElementById("settings.queryType"));
    seedParent.appendChild(document.getElementById("settings.seed"));
}

function saveSettings () {
    applyFixedClasses();
    let sts = Object.assign({}, settings);
    for (let s of unsaveableSettings) {
        delete sts[s];
    }
    storage.save(STORAGE_KEY, sts);
}

export function setInputValue (e = {}) {
    let isEvent = !(e instanceof HTMLElement),
        id, el = isEvent ? (e.target || e.srcElement) : e;
    if (!el)
        return e;
    if ((id = el.getAttribute(`id`)).indexOf(`settings.`) === 0) {
        let key = id.replace(/^settings\./, ``),
            prop = el.getAttribute("type") === "checkbox" ? "checked" : "value";
        if (isEvent) {
            settings[key] = el[prop];
            changes.push([key, el[prop]]);
            saveSettings();
        } else {
            el[prop] = settings[key];
        }
    }
    return e;
}

export function init (uiSt) {
    let params = url.getSearchString();
    for (let param in params) {
        let type = getObjProp(settingsTypes, param.split(".")),
            v = params[param];
        if (typeof type === "undefined")
            continue;
        settings[param] =
            type === String ? v :
            type === Number ? parseFloat(v) :
            type === Boolean ? (v === "false" ? false : v === "" ? true : !!v) :
            type instanceof Set ? (type.has(v) ? v : settings[param]) :
            settings[param];
    }
    uiState = uiSt;
    preservedToolbarElement = document.getElementById("preservedToolbar");
    querySettingElement = document.getElementById("querySetting");
    seedSettingElement = document.getElementById("seedSetting");
    applyFixedClasses();
}