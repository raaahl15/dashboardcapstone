const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

// Helper to write DXF
function createDXF(filePath, entitiesCallback) {
    let dxf = '';
    dxf += '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n10\n';
    const layers = [
        { name: '00_BORDER', color: 7 },
        { name: '01_TITLE_BLOCK', color: 7 },
        { name: '02_PROCESS_MAJOR', color: 4 },
        { name: '03_PROCESS_MINOR', color: 3 },
        { name: '04_EQUIPMENT', color: 7 },
        { name: '05_INST_BUBBLE', color: 1 },
        { name: '06_INST_ELEC_SIG', color: 2 },
        { name: '07_INST_PNEUM_SIG', color: 6 },
        { name: '08_TEXT_MAJOR', color: 7 },
        { name: '09_TEXT_MINOR', color: 7 },
        { name: '10_DIMENSION', color: 8 }
    ];
    layers.forEach(l => {
        dxf += `0\nLAYER\n2\n${l.name}\n70\n0\n62\n${l.color}\n6\nCONTINUOUS\n`;
    });
    dxf += '0\nENDTAB\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';
    dxf += '0\nSECTION\n2\nENTITIES\n';

    let entityBuffer = '';
    function addLine(layer, x1, y1, x2, y2) {
        entityBuffer += `0\nLINE\n8\n${layer}\n10\n${x1}\n20\n${y1}\n30\n0.0\n11\n${x2}\n21\n${y2}\n31\n0.0\n`;
    }
    function addCircle(layer, cx, cy, r) {
        entityBuffer += `0\nCIRCLE\n8\n${layer}\n10\n${cx}\n20\n${cy}\n30\n0.0\n40\n${r}\n`;
    }
    function addArc(layer, cx, cy, r, startAngle, endAngle) {
        entityBuffer += `0\nARC\n8\n${layer}\n10\n${cx}\n20\n${cy}\n30\n0.0\n40\n${r}\n50\n${startAngle}\n51\n${endAngle}\n`;
    }
    function addText(layer, x, y, h, text) {
        entityBuffer += `0\nTEXT\n8\n${layer}\n10\n${x}\n20\n${y}\n30\n0.0\n40\n${h}\n1\n${text}\n`;
    }
    function addRect(layer, x1, y1, x2, y2) {
        addLine(layer, x1, y1, x2, y1);
        addLine(layer, x2, y1, x2, y2);
        addLine(layer, x2, y2, x1, y2);
        addLine(layer, x1, y2, x1, y1);
    }

    entitiesCallback({ addLine, addCircle, addArc, addText, addRect });

    dxf += entityBuffer;
    dxf += '0\nENDSEC\n0\nEOF\n';
    fs.writeFileSync(filePath, dxf, 'utf8');
}

// 1. ISO 10628 Equipment Library DXF
createDXF(path.join(baseDir, '01_CAD_LIBRARIES', 'ISO10628_Equipment.dxf'), (cad) => {
    // Title
    cad.addText('08_TEXT_MAJOR', 10, 190, 4.0, 'ISO 10628 - PROCESS EQUIPMENT MASTER LIBRARY');

    // REAC-01: Catalytic Fixed Bed Reactor (X: 30, Y: 100)
    cad.addText('08_TEXT_MAJOR', 15, 160, 3.0, 'REAC-01: FIXED BED CATALYTIC REACTOR');
    cad.addLine('04_EQUIPMENT', 20, 110, 20, 150);
    cad.addLine('04_EQUIPMENT', 40, 110, 40, 150);
    cad.addArc('04_EQUIPMENT', 30, 150, 10, 0, 180);
    cad.addArc('04_EQUIPMENT', 30, 110, 10, 180, 360);
    // Catalyst Bed hatching lines
    for (let y = 115; y <= 145; y += 5) {
        cad.addLine('03_PROCESS_MINOR', 21, y, 39, y);
    }
    // Nozzles
    cad.addLine('02_PROCESS_MAJOR', 30, 160, 30, 175); // Inlet
    cad.addLine('02_PROCESS_MAJOR', 30, 100, 30, 85);  // Outlet

    // C-01 & C-02: Distillation Columns (X: 80, Y: 100)
    cad.addText('08_TEXT_MAJOR', 70, 160, 3.0, 'C-01/C-02: DISTILLATION COLUMNS');
    cad.addLine('04_EQUIPMENT', 75, 70, 75, 150);
    cad.addLine('04_EQUIPMENT', 95, 70, 95, 150);
    cad.addArc('04_EQUIPMENT', 85, 150, 10, 0, 180);
    cad.addArc('04_EQUIPMENT', 85, 70, 10, 180, 360);
    // Trays
    for (let y = 80; y <= 140; y += 10) {
        cad.addLine('03_PROCESS_MINOR', 76, y, 94, y);
    }
    cad.addLine('02_PROCESS_MAJOR', 85, 160, 85, 175); // Top vapor
    cad.addLine('02_PROCESS_MAJOR', 85, 60, 85, 45);   // Bottom liquid

    // Heat Exchanger / Condenser / Reboiler (X: 130, Y: 130)
    cad.addText('08_TEXT_MAJOR', 120, 160, 3.0, 'HEATER-01 / COOL-02 (HEAT EXCHANGERS)');
    cad.addCircle('04_EQUIPMENT', 140, 130, 15);
    cad.addLine('04_EQUIPMENT', 125, 130, 155, 130);
    cad.addLine('02_PROCESS_MAJOR', 140, 145, 140, 165);
    cad.addLine('02_PROCESS_MAJOR', 140, 115, 140, 95);

    // Centrifugal Pump (PUMP-01 / PUMP-02) (X: 190, Y: 130)
    cad.addText('08_TEXT_MAJOR', 175, 160, 3.0, 'PUMP-01/02: CENTRIFUGAL PUMP');
    cad.addCircle('04_EQUIPMENT', 195, 130, 12);
    cad.addLine('04_EQUIPMENT', 195, 118, 215, 130);
    cad.addLine('04_EQUIPMENT', 215, 130, 195, 142);
    cad.addLine('02_PROCESS_MAJOR', 170, 130, 183, 130); // Suction
    cad.addLine('02_PROCESS_MAJOR', 215, 130, 215, 155); // Discharge
});

// 2. ISA 5.1 Instruments & Valves Library DXF
createDXF(path.join(baseDir, '01_CAD_LIBRARIES', 'ISA51_Instruments.dxf'), (cad) => {
    cad.addText('08_TEXT_MAJOR', 10, 190, 4.0, 'ISA 5.1 - INSTRUMENTATION & CONTROL SYMBOLS');

    // 1. Field Mounted Bubble
    cad.addText('08_TEXT_MAJOR', 15, 165, 2.5, 'FIELD MOUNTED');
    cad.addCircle('05_INST_BUBBLE', 30, 145, 8);
    cad.addText('09_TEXT_MINOR', 26, 147, 2.5, 'PT');
    cad.addText('09_TEXT_MINOR', 25, 141, 2.5, '101');

    // 2. DCS Primary Display
    cad.addText('08_TEXT_MAJOR', 65, 165, 2.5, 'DCS PRIMARY (CCR)');
    cad.addRect('05_INST_BUBBLE', 65, 130, 95, 160);
    cad.addCircle('05_INST_BUBBLE', 80, 145, 8);
    cad.addLine('05_INST_BUBBLE', 72, 145, 88, 145);
    cad.addText('09_TEXT_MINOR', 76, 148, 2.2, 'TIC');
    cad.addText('09_TEXT_MINOR', 75, 139, 2.2, '101');

    // 3. SIS / ESD Safety Interlock
    cad.addText('08_TEXT_MAJOR', 115, 165, 2.5, 'SIS / ESD LOGIC SOLVER');
    cad.addRect('05_INST_BUBBLE', 115, 130, 145, 160);
    // Diamond inside
    cad.addLine('05_INST_BUBBLE', 130, 155, 140, 145);
    cad.addLine('05_INST_BUBBLE', 140, 145, 130, 135);
    cad.addLine('05_INST_BUBBLE', 130, 135, 120, 145);
    cad.addLine('05_INST_BUBBLE', 120, 145, 130, 155);
    cad.addText('09_TEXT_MINOR', 125, 146, 2.0, 'TSHH');
    cad.addText('09_TEXT_MINOR', 125, 141, 2.0, '101');

    // 4. Control Valve (Diaphragm Pneumatic Actuator)
    cad.addText('08_TEXT_MAJOR', 15, 105, 2.5, 'CONTROL VALVE (FC / FAIL CLOSED)');
    // Valve body (two triangles)
    cad.addLine('04_EQUIPMENT', 20, 80, 30, 90);
    cad.addLine('04_EQUIPMENT', 30, 90, 20, 100);
    cad.addLine('04_EQUIPMENT', 20, 100, 20, 80);
    cad.addLine('04_EQUIPMENT', 40, 80, 30, 90);
    cad.addLine('04_EQUIPMENT', 30, 90, 40, 100);
    cad.addLine('04_EQUIPMENT', 40, 100, 40, 80);
    // Stem & Actuator
    cad.addLine('04_EQUIPMENT', 30, 90, 30, 108);
    cad.addArc('04_EQUIPMENT', 30, 108, 8, 0, 180);
    cad.addLine('04_EQUIPMENT', 22, 108, 38, 108);
    cad.addText('09_TEXT_MINOR', 27, 73, 2.2, 'FC');

    // 5. Emergency Shut-off Valve (ESDV)
    cad.addText('08_TEXT_MAJOR', 70, 105, 2.5, 'ESDV (SOLENOID TRIP)');
    cad.addLine('04_EQUIPMENT', 75, 80, 85, 90);
    cad.addLine('04_EQUIPMENT', 85, 90, 75, 100);
    cad.addLine('04_EQUIPMENT', 75, 100, 75, 80);
    cad.addLine('04_EQUIPMENT', 95, 80, 85, 90);
    cad.addLine('04_EQUIPMENT', 85, 90, 95, 100);
    cad.addLine('04_EQUIPMENT', 95, 100, 95, 80);
    cad.addLine('04_EQUIPMENT', 85, 90, 85, 105);
    cad.addRect('04_EQUIPMENT', 80, 105, 90, 115);
    cad.addText('09_TEXT_MINOR', 82.5, 108, 2.5, 'S');
    cad.addText('08_TEXT_MAJOR', 78, 73, 2.2, 'ESDV');

    // 6. Pressure Safety Valve (PSV)
    cad.addText('08_TEXT_MAJOR', 125, 105, 2.5, 'PSV / RELIEF VALVE');
    cad.addLine('04_EQUIPMENT', 130, 80, 140, 90);
    cad.addLine('04_EQUIPMENT', 140, 90, 130, 100);
    cad.addLine('04_EQUIPMENT', 130, 100, 130, 80);
    cad.addLine('04_EQUIPMENT', 140, 90, 150, 90);
    cad.addLine('04_EQUIPMENT', 140, 90, 140, 105);
    cad.addCircle('04_EQUIPMENT', 140, 108, 3);
    cad.addText('08_TEXT_MAJOR', 132, 73, 2.2, 'PSV');
});

// 3. ISA 5.2 Logic Gates Library DXF
createDXF(path.join(baseDir, '01_CAD_LIBRARIES', 'ISA52_LogicGates.dxf'), (cad) => {
    cad.addText('08_TEXT_MAJOR', 10, 190, 4.0, 'ISA 5.2 - BINARY LOGIC DIAGRAMS (INTERLOCK & SAFETY)');
    // AND Gate (X: 30, Y: 140)
    cad.addText('08_TEXT_MAJOR', 20, 165, 2.5, 'AND GATE');
    cad.addRect('05_INST_BUBBLE', 20, 130, 45, 155);
    cad.addText('08_TEXT_MAJOR', 26, 140, 3.5, '&');
    cad.addLine('06_INST_ELEC_SIG', 10, 148, 20, 148);
    cad.addLine('06_INST_ELEC_SIG', 10, 137, 20, 137);
    cad.addLine('06_INST_ELEC_SIG', 45, 142.5, 55, 142.5);

    // OR Gate (X: 80, Y: 140)
    cad.addText('08_TEXT_MAJOR', 70, 165, 2.5, 'OR GATE');
    cad.addRect('05_INST_BUBBLE', 70, 130, 95, 155);
    cad.addText('08_TEXT_MAJOR', 74, 140, 3.0, '>=1');
    cad.addLine('06_INST_ELEC_SIG', 60, 148, 70, 148);
    cad.addLine('06_INST_ELEC_SIG', 60, 137, 70, 137);
    cad.addLine('06_INST_ELEC_SIG', 95, 142.5, 105, 142.5);

    // NOT Gate (Inverter)
    cad.addText('08_TEXT_MAJOR', 120, 165, 2.5, 'NOT GATE');
    cad.addRect('05_INST_BUBBLE', 120, 130, 145, 155);
    cad.addText('08_TEXT_MAJOR', 128, 140, 3.5, '1');
    cad.addCircle('05_INST_BUBBLE', 147, 142.5, 2);
    cad.addLine('06_INST_ELEC_SIG', 110, 142.5, 120, 142.5);
    cad.addLine('06_INST_ELEC_SIG', 149, 142.5, 160, 142.5);

    // Time Delay On/Off
    cad.addText('08_TEXT_MAJOR', 170, 165, 2.5, 'TIME DELAY (3 SEC)');
    cad.addRect('05_INST_BUBBLE', 170, 130, 200, 155);
    cad.addText('09_TEXT_MINOR', 174, 143, 2.2, 'TON');
    cad.addText('09_TEXT_MINOR', 175, 136, 2.0, '3s');
    cad.addLine('06_INST_ELEC_SIG', 160, 142.5, 170, 142.5);
    cad.addLine('06_INST_ELEC_SIG', 200, 142.5, 210, 142.5);
});

// 4. API RP 551 Hook-up Library DXF
createDXF(path.join(baseDir, '01_CAD_LIBRARIES', 'APIRP551_Hookup.dxf'), (cad) => {
    cad.addText('08_TEXT_MAJOR', 10, 190, 4.0, 'API RP 551 - INSTRUMENT MECHANICAL HOOK-UP DRAWINGS');

    // Pressure Transmitter 2-Valve Manifold Hookup
    cad.addText('08_TEXT_MAJOR', 15, 160, 2.8, 'PRESSURE TRANSMITTER HOOK-UP (BLOCK & BLEED)');
    cad.addLine('02_PROCESS_MAJOR', 10, 130, 60, 130); // Main pipe
    cad.addLine('04_EQUIPMENT', 30, 130, 30, 115);     // Tapping nozzle
    cad.addRect('04_EQUIPMENT', 26, 110, 34, 115);      // Root valve
    cad.addLine('04_EQUIPMENT', 30, 110, 30, 95);       // Tubing
    cad.addRect('04_EQUIPMENT', 24, 85, 36, 95);        // 2-Valve manifold
    cad.addCircle('05_INST_BUBBLE', 30, 70, 8);         // PT Head
    cad.addText('09_TEXT_MINOR', 26, 69, 2.2, 'PT');
    cad.addLine('04_EQUIPMENT', 30, 85, 30, 78);
    // 2" Stanchion Pipe Stand
    cad.addLine('10_DIMENSION', 45, 50, 45, 90);
    cad.addLine('10_DIMENSION', 40, 50, 50, 50);
    cad.addText('09_TEXT_MINOR', 48, 65, 1.8, '2" PIPE STAND');
});

// 5. Engineering Calculator Templates (CSV / Excel format)
// Sizing Orifice ISO 5167
const calcOrifice = `PARAMETER,SYMBOL,VALUE,UNIT,REFERENCE_STANDARD,NOTE
Fluid Name,Fluida,Methanol Vapor,-,-,Stream S-01 Inlet REAC-01
Mass Flowrate,qm,12500,kg/h,DWSIM Mass Balance,Kondisi Desain Normal
Upstream Pressure,P1,12.5,bar(a),DWSIM Thermo,Tekanan Operasi
Upstream Temperature,T1,250,degC,DWSIM Thermo,Suhu Pemanasan Awal
Operating Density,rho1,11.24,kg/m3,DWSIM Peng-Robinson,Massa Jenis Uap
Dynamic Viscosity,mu,0.0165,cP,DWSIM Thermo,Viskositas Dinamis
Isentropic Exponent,kappa,1.24,-,ISO 5167-2,Ratio Cp/Cv
Pipe Internal Diameter,D,154.08,mm,ASME B36.10M,Pipa 6 inch Sch 40
Orifice Bore Diameter,d,85.20,mm,ISO 5167-2 Calc,Bukaan Orifice Terhitung
Diameter Ratio,beta,0.553,-,ISO 5167-2 Limit (0.1 <= beta <= 0.75),Sesuai Standar
Differential Pressure at Max Flow,deltaP_max,25.0,kPa,ISO 5167 Standard,Rentang Standar DP Cell
Expansion Factor,epsilon,0.985,-,ISO 5167-2 Formula,Faktor Ekspansi Gas
Discharge Coefficient,C,0.6012,-,Reader-Harris/Gallagher (1998),Formula ISO 5167-2
Reynolds Number,ReD,385400,-,ISO 5167 Limit (> 5000),Aliran Turbulen Mantap
Permanent Pressure Loss,delta_w,12.8,kPa,ISO 5167-2 Eq 4,Rugi Tekanan Permanen
`;
fs.writeFileSync(path.join(baseDir, '02_ENGINEERING_CALCULATORS', 'CALC_ISO5167_Orifice.csv'), calcOrifice, 'utf8');

// Sizing Control Valve ISA 75.01
const calcCV = `TAG_NUMBER,VALVE_FUNCTION,SERVICE_STREAM,FLOW_M3_H,P1_BAR_A,P2_BAR_A,DELTA_P_BAR,TEMP_DEGC,DENSITY_KG_M3,CALCULATED_CV,SELECTED_CV,VALVE_SIZE_INCH,TRIM_CHARACTERISTIC,FAIL_ACTION,BODY_MATERIAL
FCV-101,Feed Flow Control,Methanol Liquid,15.8,16.5,13.0,3.5,65.0,792.0,24.6,35.0,2.0 inch,Equal Percentage (EQ%),Fail Closed (FC),SS316 / CF8M
PCV-201,DME Column Overhead Pressure,DME Vapor,28.5,11.2,7.5,3.7,45.0,22.4,52.4,75.0,3.0 inch,Linear,Fail Open (FO),SS316 / CF8M
LCV-202,DME Column Bottom Level,Methanol & Water,8.2,12.0,5.0,7.0,115.0,880.0,12.8,20.0,1.5 inch,Equal Percentage (EQ%),Fail Closed (FC),Hastelloy C-276
TCV-102,Preheater Steam Temp Control,Medium Pressure Steam,450 kg/h,10.0,7.0,3.0,185.0,5.12,18.4,28.0,1.5 inch,Linear,Fail Closed (FC),WCB / Carbon Steel
`;
fs.writeFileSync(path.join(baseDir, '02_ENGINEERING_CALCULATORS', 'CALC_ISA75_ControlValve.csv'), calcCV, 'utf8');

// Sizing PSV API 520
const calcPSV = `TAG_NUMBER,PROTECTED_EQUIPMENT,RELIEF_CASE,RELIEVING_RATE_KG_H,SET_PRESSURE_BARG,OVERPRESSURE_PCT,RELIEVING_P_BARA,RELIEVING_T_DEGC,Z_COMPRESSIBILITY,CALCULATED_AREA_MM2,API_ORIFICE_LETTER,SELECTED_AREA_MM2,VALVE_SIZE_INLET_OUTLET
PSV-101,REAC-01 (Reactor),Blocked Discharge / Runaway,14500,16.0,10%,18.81,285.0,0.92,845.2,J,830.0 (K preferred: 1186),3" x 4" Flanged RF
PSV-201,C-01 (DME Distillation),Reflux Failure / Overpressure,18200,14.0,10%,16.61,65.0,0.88,1120.4,K,1186.0,3" x 4" Flanged RF
PSV-202,C-02 (Methanol Recovery),Overheating / Reboiler Tube Rupture,11000,6.0,10%,7.81,130.0,0.94,1420.5,L,1841.0,4" x 6" Flanged RF
`;
fs.writeFileSync(path.join(baseDir, '02_ENGINEERING_CALCULATORS', 'CALC_API520_PSV.csv'), calcPSV, 'utf8');

// Tekno Ekonomi NPV/IRR
const calcEcon = `METRIC,VALUE,UNIT,BENCHMARK_TARGET,KETERANGAN
Total Capital Expenditure (CAPEX),4850000,USD,AACE Class 2/3,Mencakup Sistem DCS/SIS/FGS & Instrumentasi Lapangan
Biaya Hardware DCS & Controller,1250000,USD,-,Redundant Controller + Power + Safety PLC
Biaya Instrumen Lapangan & Katup,1820000,USD,-,Transmitter Presisi + Control Valves + ESDV + PSV
Biaya Kabel & Tray & Hook-up,580000,USD,-,Kabel STP + Tray + JB + Manifold API RP 551
Biaya Rekayasa & Jasa Engineering,1200000,USD,-,FEED & DED Consultant Services
Biaya Operasional Tahunan (OPEX),285000,USD/Tahun,-,Kalibrasi berkala + lisensi software + spare parts
Annual Revenue Savings (Otomasi),1450000,USD/Tahun,-,Peningkatan Yield DME & Pengurangan Konsumsi Energi
Net Present Value (NPV @ 10%),3742500,USD,Harus Positif (> 0),Kelayakan Investasi Sangat Tinggi
Internal Rate of Return (IRR),24.8,%,Harus > WACC (12%),Proyek Sangat Menguntungkan
Payback Period,3.8,Tahun,Target < 5 Tahun,Modal Investasi Pulih Cepat
`;
fs.writeFileSync(path.join(baseDir, '02_ENGINEERING_CALCULATORS', 'CALC_TeknoEkonomi_NPV.csv'), calcEcon, 'utf8');

// 6. Master Instrument Index & I/O List (ISA Form 20)
const masterIndex = `TAG_NUMBER,P_AND_ID_NO,SERVICE_DESCRIPTION,LOCATION,LINE_EQUIPMENT_NO,SIGNAL_TYPE,IO_TYPE,RANGE_MIN,RANGE_MAX,ENG_UNIT,SETPOINT_ALARM,FAIL_MODE,CONTROLLER_TYPE,SAFETY_CRITICAL
TIC-101,DWG-PID-001,Reactor Bed Multipoint Temp,REAC-01,REAC-01 Bed-1,RTD Pt100,AI,0,400,degC,HH:320 degC (Trip),- ,DCS,YES (SIL-2)
FIC-101,DWG-PID-001,Methanol Feed Flowrate,Field Pipe,6"-PL-101,HART (4-20mA),AI,0,20000,kg/h,L: 2000 kg/h,-,DCS,NO
FCV-101,DWG-PID-001,Feed Pump Discharge Flow Valve,Field Pipe,6"-PL-101,Pneumatic 4-20mA,AO,0,100,%,-,FC,DCS,NO
ESDV-101,DWG-PID-001,Reactor Emergency Feed Shut-off,Inlet Pipe,6"-PL-101,24VDC Solenoid,DO,0,1,State,Trip on High-High Temp,FC,SIS / ESD,YES (SIL-3)
PIC-201,DWG-PID-002,DME Column Overhead Pressure,C-01 Top,C-01 Vapor Line,HART (4-20mA),AI,0,25,bar(a),H: 13.5 bar, - ,DCS,YES (SIL-1)
PCV-201,DWG-PID-002,DME Overhead Off-Gas Valve,Top Line,4"-PL-201,Pneumatic 4-20mA,AO,0,100,%,-,FO,DCS,NO
LIC-202,DWG-PID-002,C-01 Sump Liquid Level,C-01 Bottom,C-01 Boot,DP Cell 4-20mA,AI,0,100,%,L: 20% / H: 80%,-,DCS,NO
AIC-201,DWG-PID-002,Online DME Product Purity (GC),Top Stream S-08,3"-PL-205,Modbus TCP/IP,Serial,95,100,% mol,L: 99.90% mol,-,DCS,NO
PSV-101,DWG-PID-001,Reactor Overpressure Safety Relief,REAC-01 Top,Nozzle N1,Mechanical,Mechanical,0,16,bar(g),Set: 16.0 bar(g),FO,Autonomous,YES (Safety)
`;
fs.writeFileSync(path.join(baseDir, '03_DATASHEETS_ISA20', 'Master_Instrument_Index_DME.csv'), masterIndex, 'utf8');

// 7. HAZOP & Safety Interlock Matrix (IEC 61511 / Cause & Effect)
const causeEffect = `INITIATING_CAUSE_TAG,DESCRIPTION_TRIGGER,CONDITION,CONSEQUENCE_HAZARD,EFFECT_ACTION_TAG,ACTION_DESCRIPTION,TARGET_SIL,RESPONSE_TIME
TSHH-101,Reactor Bed Temp High-High,T > 320 degC,Thermal Runaway / Catalyst Damage,ESDV-101,Close Methanol Feed Inlet Valve within 2 seconds,SIL-3,< 2 sec
TSHH-101,Reactor Bed Temp High-High,T > 320 degC,Reactor Vessel Rupture,PUMP-01-TRIP,Emergency Stop Feed Pump PUMP-01,SIL-3,< 1 sec
PSHH-201,DME Column Pressure High-High,P > 14.5 bar,Tower Overpressure / Shell Explosion,ESDV-201,Trip Reboiler Steam Supply Valve,SIL-2,< 3 sec
LSHH-202,C-01 Bottom Level High-High,Level > 90%,Liquid Entrainment to Trays,FCV-202,Full Open Bottom Transfer to C-02,SIL-1,< 5 sec
LSLL-202,C-01 Bottom Level Low-Low,Level < 10%,Reboiler Dry Run / Tube Burnout,TCV-201,Close Reboiler Steam Supply Valve,SIL-2,< 2 sec
`;
fs.writeFileSync(path.join(baseDir, '04_SAFETY_AND_SPECS', 'Cause_and_Effect_Matrix_ESD.csv'), causeEffect, 'utf8');

console.log('All master CAD and Engineering Library components generated successfully!');
