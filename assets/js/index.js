import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const container = document.getElementById("viewer-container");
const estructuraIFC = document.querySelector(".ifc-tree-menu");
const propertiesButton = document.getElementById("properties-button");
const structureButton = document.getElementById("structure-button");
const propiedades = document.getElementById("tabla");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0xdddddd),
});
viewer.context.ifcCamera.cameraControls.setLookAt(50, 50, 50, 0, 0, 0);
viewer.context.ifcCamera.cameraControls.dollyToCursor = true;

//*A_01_Cargar archivo introducidos por usuario
const input = document.getElementById("file-input");
input.addEventListener(
  "change",
  async (changed) => {
    await viewer.IFC.setWasmPath("../config/wasm/");
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    const model = await viewer.IFC.loadIfcUrl(ifcURL, true);
    viewer.context.renderer.postProduction.active = true;
    const ifcProject = await viewer.IFC.getSpatialStructure(
      model.modelID,
      true
    );
    createTreeMenu(ifcProject);
    mostrarElementos();
  },
  false
);

//*A_02_Mostrar estructura IFC
// Tree view
const toggler = document.getElementsByClassName("caret");
for (let i = 0; i < toggler.length; i++) {
  toggler[i].onclick = () => {
    toggler[i].parentElement
      .querySelector(".nested")
      .classList.toggle("active");
    toggler[i].classList.toggle("caret-down");
  };
}

// Spatial tree menu
function createTreeMenu(ifcProject) {
  const root = document.getElementById("tree-root");
  const ifcProjectNode = createNestedChild(root, ifcProject);
  ifcProject.children.forEach((child) => {
    constructTreeMenuNode(ifcProjectNode, child);
  });
}

function nodeToString(node) {
  if (node.Name) {
    return `${node.type} - ${node.Name.value}`;
  } else {
    return node.type;
  }
}

function constructTreeMenuNode(parent, node) {
  const children = node.children;
  if (children.length === 0) {
    createSimpleChild(parent, node);
    return;
  }
  const nodeElement = createNestedChild(parent, node);
  children.forEach((child) => {
    constructTreeMenuNode(nodeElement, child);
  });
}

function createNestedChild(parent, node) {
  const content = nodeToString(node);
  const root = document.createElement("li");
  createTitle(root, content);
  const childrenContainer = document.createElement("ul");
  childrenContainer.classList.add("nested");
  root.appendChild(childrenContainer);
  parent.appendChild(root);
  return childrenContainer;
}

function createTitle(parent, content) {
  const title = document.createElement("span");
  title.classList.add("caret");
  title.onclick = () => {
    title.parentElement.querySelector(".nested").classList.toggle("active");
    title.classList.toggle("caret-down");
  };
  title.textContent = content;
  parent.appendChild(title);
}

function createSimpleChild(parent, node) {
  const content = nodeToString(node);
  const childNode = document.createElement("li");
  childNode.classList.add("leaf-node");
  childNode.textContent = content;
  parent.appendChild(childNode);

  childNode.onmouseenter = () => {
    viewer.IFC.selector.prepickIfcItemsByID(0, [node.expressID]);
  };

  childNode.onclick = async () => {
    viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID]);
  };
}

//*A_03_Mostrar propiedades elementos al hacer click

function createPropertiesMenu(properties) {
  delete properties.mats;
  delete properties.type;
  delete properties.OwnerHistory;
  delete properties.ObjectPlacement;
  delete properties.Representation;
  
  $("#propiedades").html(`
  <tr>
          <th class="cabecera">Nombre</th>
          <th class="cabecera">Valor</th>          
        </tr>
  `);
  for (let key in properties) {
    createPropertyEntry(key, properties[key]);
  }
}

function createPropertyEntry(key, value) {
  const propContainer = document.createElement("tr");

  if (value === null || value === undefined) value = "undefined";
  else if (value.value) value = value.value;
  const keyElement = document.createElement("th");
  const valueElement = document.createElement("th");
  valueElement.classList.add("ifc-property-value");
  if (typeof value !== "object") {
    keyElement.textContent = key;
    propContainer.appendChild(keyElement);

    valueElement.textContent = value;
    propContainer.appendChild(valueElement);
  } else {
    if (key === "psets") {
      mostarPropiedadesPsets(value);
    }
  }
  $("#propiedades").append(propContainer);
}
function mostarPropiedadesPsets(value) {
  for (let index = 0; index < value.length; index++) {
    //TODO: MOSTRAR ANIDACIÓN
    // const propContainer = document.createElement("tr");
    // const keyElement = document.createElement("th");
    // keyElement.textContent = value[index].Name.value;

    let hProps = value[index].HasProperties;
    for (const clave in hProps) {
      const propContainer = document.createElement("tr");
      const keyElement2 = document.createElement("th");
      const valueElement2 = document.createElement("th");
      keyElement2.textContent = hProps[clave].Name.value;
      propContainer.appendChild(keyElement2);

      if (hProps[clave].NominalValue.value) {
        if (hProps[clave].NominalValue.value == "F") {
          valueElement2.textContent = "No";
          propContainer.appendChild(valueElement2);
        } else {
          valueElement2.textContent = hProps[clave].NominalValue.value;
          propContainer.appendChild(valueElement2);
        }
      }
      $("#propiedades").append(propContainer);
    }
  }
}

//*A_05_Resaltar elementos haciendo hover/click en ellos
window.onclick = async () => {
  //*Poner segundo parametro a false para que la selección anterior no se elimine
  const result = await viewer.IFC.selector.pickIfcItem(true);
  if (!result) return;
  const { modelID, id } = result;
  const props = await viewer.IFC.getProperties(modelID, id, true, true);
  createPropertiesMenu(props);
};
window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

//*A_10_Realizar cortes en el plano
const clipperButton = document.getElementById("clipper-button");
let clippingPlanesActive = false;
clipperButton.onclick = () => {
  clippingPlanesActive = !clippingPlanesActive;
  viewer.clipper.active = clippingPlanesActive;

  if (clippingPlanesActive) {
    clipperButton.classList.add("active-buttons");
  } else {
    clipperButton.classList.remove("active-buttons");
  }
};

window.ondblclick = () => {
  if (clippingPlanesActive) {
    viewer.clipper.createPlane();
  }
};

window.onkeydown = (event) => {
  if (event.code === "Delete" && clippingPlanesActive) {
    viewer.clipper.deleteAllPlanes();
  }
};

//*EXTRAS
function mostrarElementos() {
  buttons.classList.remove("ocultar");
}

structureButton.addEventListener("click", () => {
  estructuraIFC.classList.toggle("ocultar");
  structureButton.classList.toggle("active-buttons");
});

propertiesButton.addEventListener("click", () => {
  propiedades.classList.toggle("ocultar");
  propertiesButton.classList.toggle("active-buttons");
});
