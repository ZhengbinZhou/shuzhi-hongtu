import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir=path.dirname(fileURLToPath(import.meta.url));
const projectRoot=path.resolve(scriptDir,"..");
const outputDir=path.join(projectRoot,"offline-dist");
const assetsDir=path.join(outputDir,"assets");
const sourceImages=path.join(projectRoot,"public","landmarks");
const targetImages=path.join(outputDir,"landmarks");

fs.rmSync(targetImages,{recursive:true,force:true});
fs.cpSync(sourceImages,targetImages,{recursive:true});

for(const name of fs.readdirSync(assetsDir)){
  if(!name.endsWith(".js"))continue;
  const file=path.join(assetsDir,name);
  const source=fs.readFileSync(file,"utf8");
  fs.writeFileSync(file,source.replaceAll('"/landmarks/','"./landmarks/').replaceAll("'/landmarks/","'./landmarks/"));
}

const htmlPath=path.join(outputDir,"index.html");
const html=fs.readFileSync(htmlPath,"utf8");
fs.writeFileSync(htmlPath,html.replace("</head>",'<meta name="offline-print" content="a4-multipage"></head>'));
console.log(outputDir);
