import {Buffer} from 'buffer';
import Papa from 'papaparse'
import jszip from 'jszip'


const loadData = async (zipFiles, filename) => {
  const item = zipFiles.files[filename];
  const buffer = Buffer.from(await item.async('arrayBuffer')).toString('base64');
  const data = await readFile(buffer);

  return data;
}

const readFile = async (buffer) => {
  return new Promise(resolve => {
    Papa.parse(atob(buffer), {
      download: false,
      delimiter: " ",
      dynamicTyping: true,
      skipEmptyLines: true,
      header: false,
      complete: results => {
        resolve(results.data);
      }
    })
  })
};

onmessage = (e) => {
  let zipContent = e.data[0];
  let stabilization = e.data[1];
  let threeDimensions = e.data[2];

  postMessage({type: "process", percent: 0});
  
  (async () => {
    let zipFiles = await jszip.loadAsync(zipContent);
    zipContent = [];
    let zipKeys = Object.keys(zipFiles.files);

    postMessage({type: "process", percent: 10});

    let B = await loadData(zipFiles, 'B_mat.txt');
    let K = await loadData(zipFiles, 'K_mat.txt');
    let coeffL2 = await loadData(zipFiles, 'coeffL2_mat.txt');
    let mu = await loadData(zipFiles, 'par.txt');
    let nPhiU = B.length;
    let nPhiP = K[0].length;
    let nPhiNut = coeffL2.length;

    postMessage({type: "constructor", nPhiU: nPhiU, nPhiP: nPhiP, nPhiNut});
    postMessage({type: "process", percent: 15});

    if (stabilization === "supremizer") {
      let P = await loadData(zipFiles, 'P_mat.txt');

      postMessage({type: "matrices", P: P, K: K, B: B});
      P = [];
    }
    else if (stabilization === "PPE") {
      let D = await loadData(zipFiles, 'D_mat.txt');
      let BC3 = await loadData(zipFiles, 'BC3_mat.txt');
    
      postMessage({type: "matrices", D: D, K: K, B: B, BC3: BC3});
      D = [];
      BC3 = [];
    }
    else {
      // TODO: check
    }

    K = [];
    B = [];

    postMessage({type: "process", percent: 20});

    let modes = await loadData(zipFiles, 'EigenModes_U_mat.txt');
    postMessage({type: "modes", modes: modes});
    postMessage({type: "process", percent: 30});
    modes = [];

    let indexesU = []
    for (let j = 0; j < nPhiU; j ++ ) {
      indexesU.push(j);
    }

    let indexesNut = []
    for (let j = 0; j < nPhiNut; j ++ ) {
      indexesNut.push(j);
    }

    let indexesP = []
    for (let j = 0; j < nPhiP; j ++ ) {
      indexesP.push(j);
    }

    let Ct1Array = [];
    await Promise.all(indexesU.map(async (index) => {
      let C1Path = 'ct1_' + index + "_mat.txt";
      let C1 = await loadData(zipFiles, C1Path);
      
      Ct1Array.push(C1);
    }));
    postMessage({type: "Ct1", Ct1: Ct1Array});
    postMessage({type: "process", percent: 35});
    Ct1Array = [];

    let Ct2Array = [];
    await Promise.all(indexesU.map(async (index) => {
      let C2Path = 'ct2_' + index + "_mat.txt";
      let C2 = await loadData(zipFiles, C2Path);

      Ct2Array.push(C2);
    }));
    postMessage({type: "Ct2", Ct2: Ct2Array});
    postMessage({type: "process", percent: 40});
    Ct2Array = [];

    let weightArray = [];
    await Promise.all(indexesNut.map(async (indexNut) => {
      let weightPath = 'wRBF_' + indexNut + '_mat.txt';
      let weight = await loadData(zipFiles, weightPath);

      weightArray.push(weight);
    }));
    postMessage({type: "weights", weights: weightArray});
    postMessage({type: "process", percent: 50});
    weightArray = [];


    let CArray = [];
    await Promise.all(indexesU.map(async (index) => {
      let CPath = 'C' + index + "_mat.txt"
      let C = await loadData(zipFiles, CPath);

      CArray.push(C);
    }));
    postMessage({type: "C", C: CArray});
    postMessage({type: "process", percent: 60});
    CArray = [];

    if (stabilization === "PPE") {
      let GArray = [];

      await Promise.all(indexesP.map(async (index) => {
        let GPath = 'G' + index + "_mat.txt"
        let G = await loadData(zipFiles, GPath);

        GArray.push(G);
      }));

      postMessage({type: "GMatrix", G: GArray });
      postMessage({type: "process", percent: 65});
      GArray = [];
    }
        
    let gridItem = zipFiles.files['internal.vtu'];
    let gridData = Buffer.from(await gridItem.async('arraybuffer'));

    postMessage({type: "grid", grid: gridData });
    postMessage({type: "process", percent: 70});
    gridItem = [];
    gridData = [];

    postMessage({type: "RBF", mu: mu, coeffL2: coeffL2});
    postMessage({type: "process", percent: 75});
    mu = [];
    coeffL2 = [];

    let vtpFile = zipKeys.filter((x) => [".vtp"].some(e => x.endsWith(e)));

    if (vtpFile != null && threeDimensions) {
      let vtpItem = zipFiles.files[vtpFile[0]];
      let vtpData = Buffer.from(await vtpItem.async('arraybuffer'));
          
      postMessage({type: "vtp", vtp: vtpData});
      postMessage({type: "process", percent: 80});  
      vtpFile = [];
      vtpData = [];
    }
        
    postMessage({type: "process", percent: 90});  
    postMessage({type: "initialization", data: true});
    zipFiles = [];
  })();
}
