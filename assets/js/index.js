import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";

const container = document.getElementById("viewer-container");
const estructuraIFC = document.querySelector(".ifc-tree-menu");
const openHide = document.getElementById("open-hide");
const icono = document.getElementById('icono');
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color(0xdddddd),
});

//A_01_Cargar archivo introducidos por usuario
const input = document.getElementById("file-input");
// IfcViewerAPI.IFC.setWasmPath('../wasm');
input.addEventListener(
  "change",
  async (changed) => {
    await viewer.IFC.setWasmPath("../wasm/");
    const ifcURL = URL.createObjectURL(changed.target.files[0]);
    const model = await viewer.IFC.loadIfcUrl(ifcURL);
    viewer.context.renderer.postProduction.active = true;
    const ifcProject = await viewer.IFC.getSpatialStructure(model.modelID);
    createTreeMenu(ifcProject);
    mostrarElementos();
  },
  false
);

//A_02_Mostrar estructura IFC

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
  return `${node.type} - ${node.expressID}`;
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

//A_03_Mostrar propiedades elementos al seleccionarlos

//A_05_Resaltar elementos haciendo hover/click en ellos
window.onclick = async () => await viewer.IFC.selector.pickIfcItem();
window.onmousemove = async () => await viewer.IFC.selector.prePickIfcItem();

//Estilos
function mostrarElementos() {
  estructuraIFC.classList.remove("ocultar");
  openHide.classList.remove("ocultar");
  openHide.style.left = "24rem";  
}

openHide.addEventListener("click", () => {
  estructuraIFC.classList.toggle("ocultar");
  if (openHide.style.left == "24rem") {
    openHide.style.left = "0";
    icono.className = "fa-solid fa-arrow-right";
  } else {
    openHide.style.left = "24rem";
    icono.className = "fa-solid fa-arrow-left";
  }
});
