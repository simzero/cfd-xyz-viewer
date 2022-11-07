import {Buffer} from 'buffer';
import Papa from 'papaparse'
import jszip from 'jszip'

const transpose = (matrix) => {
  const transposed = matrix[0].map((col, i) => matrix.map(row => row[i]));

  const buffer = Float64Array.from(transposed.flat());
  return buffer;
}

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

  postMessage({event: "process", percent: 0});
  
  (async () => {
    let zipFiles = await jszip.loadAsync(zipContent);
    zipContent = [];
    let zipKeys = Object.keys(zipFiles.files);

    postMessage({event: "process", percent: 10});

    let BData = await loadData(zipFiles, 'B_mat.txt');
    let KData = await loadData(zipFiles, 'K_mat.txt');
    let coeffL2Data = await loadData(zipFiles, 'coeffL2_mat.txt');

    let BTransposed = transpose(BData);
    let KTransposed = transpose(KData);

    let nPhiU = BData.length;
    let nPhiP = KData[0].length;
    let nPhiNut = coeffL2Data.length;
    let nRuns = coeffL2Data[0].length;

    postMessage({event: "constructor", nPhiU: nPhiU, nPhiP: nPhiP, nPhiNut, nRuns: nRuns});
    postMessage({event: "process", percent: 20});

    {
      let gridItem = zipFiles.files['internal.vtu'];
      let gridData = Buffer.from(await gridItem.async('arraybuffer'));

      postMessage(
        {
          event: "grid",
          grid: gridData
        },
        [
          gridData.buffer
        ]
      );
      postMessage({event: "process", percent: 40});
    }

    if (stabilization === "supremizer") {
      let PData = await loadData(zipFiles, 'P_mat.txt');
      let PTransposed = transpose(PData);

      postMessage(
        {
          event: "matrices",
          P: PTransposed,
          K: KTransposed,
          B: BTransposed
        },
        [
          PTransposed.buffer,
          KTransposed.buffer,
          BTransposed.buffer
        ]
      );
    }
    else if (stabilization === "PPE") {
      let DData = await loadData(zipFiles, 'D_mat.txt');
      let BC3Data = await loadData(zipFiles, 'BC3_mat.txt');

      let DTransposed = transpose(DData);
      let BC3Transposed = transpose(BC3Data);

      postMessage(
        {
          event: "matrices",
          D: DTransposed,
          K: KTransposed,
          B: BTransposed,
          BC3: BC3Transposed
        },
        [
          DTransposed.buffer,
          KTransposed.buffer,
          BTransposed.buffer,
          BC3Transposed.buffer,
        ]
      );
    }
    else {
      // TODO: check
    }

    postMessage({event: "process", percent: 45});

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

    {
      await Promise.all(indexesU.map(async (index) => {
        let Ct1Path = 'ct1_' + index + "_mat.txt";
        let Ct1Data = await loadData(zipFiles, Ct1Path);
        let Ct1Transposed = transpose(Ct1Data);

        postMessage(
          {
            event: "Ct1",
            Ct1: Ct1Transposed
          },
          [
            Ct1Transposed.buffer
          ]
        );
      }));
      postMessage({event: "process", percent: 50});
    }

    {
      await Promise.all(indexesU.map(async (index) => {
        let Ct2Path = 'ct2_' + index + "_mat.txt";
        let Ct2Data = await loadData(zipFiles, Ct2Path);
        let Ct2Transposed = transpose(Ct2Data);

        postMessage(
          {
            event: "Ct2",
            Ct2: Ct2Transposed
          },
          [
            Ct2Transposed.buffer
          ]
        );
      }));
      postMessage({event: "process", percent: 55});
    }

    {
      await Promise.all(indexesNut.map(async (indexNut) => {
        let weightsPath = 'wRBF_' + indexNut + '_mat.txt';
        let weightsData = await loadData(zipFiles, weightsPath);
        let weightsTransposed = transpose(weightsData);

        postMessage(
          {
            event: "weights",
            index: indexNut,
            weights: weightsTransposed
          },
          [
            weightsTransposed.buffer
          ]
        );
      }));
      postMessage({event: "process", percent: 60});
    }

    {
      await Promise.all(indexesU.map(async (index) => {
        let CPath = 'C' + index + "_mat.txt"
        let CData = await loadData(zipFiles, CPath);
        let CTransposed = transpose(CData);

        postMessage(
          {
            event: "C",
	    C: CTransposed
          },
          [
            CTransposed.buffer
          ]
        );
      }));
      postMessage({event: "process", percent: 65});
    }

    if (stabilization === "PPE") {
      {
        await Promise.all(indexesP.map(async (index) => {
          let GPath = 'G' + index + "_mat.txt"
          let GData = await loadData(zipFiles, GPath);
          let GTransposed = transpose(GData);

          postMessage(
            {
              event: "G",
              G: GTransposed
            },
            [
              GTransposed.buffer
            ]
          );
        }));
        postMessage({event: "process", percent: 70});
      }
    }

    {
      let muData = await loadData(zipFiles, 'par.txt');
      let muTransposed = transpose(muData);
      let coeffL2Transposed = transpose(coeffL2Data);

      postMessage(
        {
          event: "RBF",
          mu: muTransposed,
          coeffL2: coeffL2Transposed
        },
        [
          muTransposed.buffer,
          coeffL2Transposed.buffer
        ]
      );
      postMessage({event: "process", percent: 75});
    }

    {
      let modesData = await loadData(zipFiles, 'EigenModes_U_mat.txt');
      let modesTransposed = transpose(modesData);

      postMessage(
        {
          event: "modes",
          modes: modesTransposed
        },
        [
          modesTransposed.buffer
        ]
      );
      postMessage({event: "process", percent: 90});
    }

    {
      let vtpFile = zipKeys.filter((x) => [".vtp"].some(e => x.endsWith(e)));

      if (vtpFile != null && threeDimensions) {
        let vtpItem = zipFiles.files[vtpFile[0]];
        let vtpData = Buffer.from(await vtpItem.async('arraybuffer'));

        postMessage(
          {
            event: "vtp",
            vtp: vtpData
          },
          [
            vtpData.buffer
          ]
        );
        postMessage({event: "process", percent: 95});
      }
    }

    zipFiles = [];
    postMessage({event: "process", percent: 100});
    postMessage({event: "initialization", data: true});
  })();
}
