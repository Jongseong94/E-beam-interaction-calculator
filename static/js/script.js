// 상수 정의
const c = 3e8;  // 빛의 속도 (m/s)
const m0_eV = 5.11e5;  // 전자의 정지 질량 (eV/c^2)
const epsilon_0 = 55.263e6;  // Vacuum permittivity [e^2/eV∙m]
const alpha = 0.007297352;  // Fine-structure constant
const amu_eV = 931.49410242e6;  // Atomic mass unit (eV/c^2)
const a0 = 5.29177e-11;  // Bohr radius in meters
const mc2_eV = 511000;  // Electron mass energy in eV (추가 상수)
const N = 2;  // Number of electrons

// 전역 변수 선언
let chartInstance = null;  // 전역 변수로 Chart 객체 저장
let ionizationChartInstance = null;  // 전역 변수로 Chart 객체를 저장
let Ee_values_global = [];
let E_threshold_values_global = [];
let crossSections_global = [];
let t_prime_values = [];  // Incident Electron Energy (keV) 값을 저장하는 전역 변수
let crossSections = [];   // Ionization Cross Section (Å²) 값을 저장하는 전역 변수

// 통합 함수: Cross Section 계산, 2D/3D 그래프 그리기 및 저장 기능 포함
function processCrossSectionData() {

    // 입력값 가져오기
    const Ee_kV_cross = parseFloat(document.getElementById('Ee-cross-value').value);  // Incident Electron Energy in keV
    const Z_atom_cross = parseFloat(document.getElementById('Z-atom-value').value);  // Atomic Number
    const A_Mass_cross = parseFloat(document.getElementById('A-Mass-value').value);  // Atomic Mass Number
    const E_threshold_cross = parseFloat(document.getElementById('Threshold-cross-value').value);  // Bond threshold in eV
    const theta_deg_cross = parseFloat(document.getElementById('theta-cross-value').value);  // Scattering Angle in degrees
    const selectedUnit = document.getElementById('unit-select').value;  // 단위 선택 (barn 또는 angstrom²)

    if (isNaN(Ee_kV_cross) || isNaN(Z_atom_cross) || isNaN(theta_deg_cross) || isNaN(A_Mass_cross) || isNaN(E_threshold_cross)) {
        alert("Please enter a valid value.");
        return;
    }

    const Ee_cross = Ee_kV_cross * 1e3;  // Ee 값을 keV에서 eV로 변환
    const theta_rad_cross = theta_deg_cross * Math.PI / 180;  // θ를 degree에서 radian으로 변환
    const M_eV_cross = A_Mass_cross * amu_eV;  // M을 Atomic Mass Number에서 eV/c^2로 변환

    // Knock-on energy Ed 계산
    const Ed_cross = (Ee_cross * (Ee_cross + 2 * m0_eV) * (1 - Math.cos(theta_rad_cross))) / M_eV_cross;  // Ed 계산

    // Emax 계산 (θ = 180도일 때)
    const Emax_cross = (2 * Ee_cross * (Ee_cross + 2 * m0_eV)) / M_eV_cross;  // Emax 계산

    // 상대론적 인자 β 및 γ 계산
    const beta_cross = Math.sqrt(1 - (1 / (1 + (Ee_cross / m0_eV)) ** 2));
    const gamma_cross = 1 / Math.sqrt(1 - beta_cross ** 2);

    // Knock-on cross section 계산
    const firstTerm_cross = Z_atom_cross / (4 * Math.PI * epsilon_0 * 2 * gamma_cross * m0_eV * (beta_cross ** 2));
    const ratio_cross = Ed_cross / E_threshold_cross;
    let crossSection_cross = 4 * Math.PI * (firstTerm_cross ** 2) * ((ratio_cross - 1) - beta_cross ** 2 * Math.log(ratio_cross) + Math.PI * Z_atom_cross * alpha * beta_cross * (2 * (Math.sqrt(ratio_cross) - 1) - Math.log(ratio_cross)));

    // 결과값을 barn 단위로 변환 (1 barn = 10^-28 m²)
    let crossSection_barns_cross = crossSection_cross / 1e-28;

    // 선택된 단위에 따라 변환 처리
    if (selectedUnit === "angstrom2") {
        crossSection_barns_cross *= 1e-8;  // 1 barn = 1e-8 Å²
    }

    // 결과 표시 (HTML로 출력)
    const unitText = selectedUnit === "barn" ? "barns" : "Å²";
    document.getElementById('cross-section-emax-result').innerHTML = `E<sub>max</sub> : ${Emax_cross.toFixed(2)} eV`;
    document.getElementById('cross-section-ed-result').innerHTML = `E<sub>θ</sub> : ${Ed_cross.toFixed(2)} eV`;
    document.getElementById('cross-section-result').innerHTML = `σ<sub>KO</sub> : ${crossSection_barns_cross.toExponential(2)} ${unitText}`;
}

// 2D 그래프 생성 함수
function generateCrossSectionGraph(Z_atom_cross, A_Mass_cross, E_threshold_cross, theta_deg_cross, selectedUnit) {
    const theta_rad_cross = theta_deg_cross * Math.PI / 180;
    const M_eV_cross = A_Mass_cross * amu_eV;

    const Ee_values = [];
    const crossSections = [];
    const pointStyles = [];


    for (let Ee_keV = 0; Ee_keV <= 300; Ee_keV += 1.0) {
        const Ee = Ee_keV * 1000;
        const Ed = (Ee * (Ee + 2 * m0_eV) * (1 - Math.cos(theta_rad_cross))) / M_eV_cross;
        const beta = Math.sqrt(1 - (1 / (1 + (Ee / m0_eV)) ** 2));
        const gamma = 1 / Math.sqrt(1 - beta ** 2);

        const firstTerm = Z_atom_cross / (4 * Math.PI * epsilon_0 * 2 * gamma * m0_eV * beta ** 2);
        const ratio = Ed / E_threshold_cross;
        let crossSection = 4 * Math.PI * (firstTerm ** 2) * ((ratio - 1) - beta ** 2 * Math.log(ratio) + Math.PI * Z_atom_cross * alpha * beta * (2 * (Math.sqrt(ratio) - 1) - Math.log(ratio)));

        if (isNaN(crossSection)) continue;

        let crossSection_barns = crossSection / 1e-28;
        if (selectedUnit === "angstrom2") crossSection_barns *= 1e-8;

        Ee_values.push(Ee_keV);
        crossSections.push(crossSection_barns);
        pointStyles.push('rgba(75, 192, 192, 1)');
    }

    const ctx = document.getElementById('cross-section-graph').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: Ee_values, datasets: [{ label: 'Knock-on Cross Section (barn)', data: crossSections, borderColor: 'rgba(75, 192, 192, 1)', fill: false }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Ee (keV)'
                    },
                    min: 0,      // X축의 최소값을 강제로 0으로 설정
                    max: 600,    // X축의 최대값을 강제로 600으로 설정
                    ticks: {
                        stepSize: 50,  // X축 간격을 50으로 설정
                        autoSkip: true,  // 자동 생략을 비활성화
                        callback: function(value, index, values) {
                            // X축의 레이블을 일정한 간격으로 표시
                            return value % 50 === 0 ? value : '';
                        }
                    }
                }, y: { title: { display: true, text: `Cross Section (${selectedUnit === 'barn' ? 'barn' : 'Å²'})` }, min: -0.1 } }
        }
    });
}

// 3D 그래프 생성 함수
function generate3DCrossSectionGraph(Z_atom_cross, A_Mass_cross, selectedUnit) {

    const Ee_values = [];
    const E_threshold_values = [];
    const crossSections = [];

    const M_eV_cross = A_Mass_cross * amu_eV;

    // E_threshold 값을 0.1 단위로 0부터 100까지 설정 (0은 제외)
    for (let E_threshold = 0.1; E_threshold <= 100; E_threshold += 0.1) {
        const crossSection_row = [];
        const E_threshold_row = [];

        // Ee 값을 0 ~ 300 keV 범위에서 1 keV 단위로 계산
        for (let Ee_keV = 0; Ee_keV <= 300; Ee_keV += 1) {
            const Ee = Ee_keV * 1000; // Ee 값을 eV로 변환
            const Ed = (2 * Ee * (Ee + 2 * m0_eV)) / M_eV_cross;  // Ed 계산
            const beta = Math.sqrt(1 - (1 / (1 + (Ee / m0_eV)) ** 2));  // 상대론적 속도 계산
            const gamma = 1 / Math.sqrt(1 - beta ** 2);  // γ 계산

            const firstTerm = Z_atom_cross / (4 * Math.PI * epsilon_0 * 2 * gamma * m0_eV * beta ** 2);
            const ratio = Ed / E_threshold;  // Ed와 E_threshold 비율 계산
            let crossSection = 4 * Math.PI * (firstTerm ** 2) * ((ratio - 1) - beta ** 2 * Math.log(ratio) + Math.PI * Z_atom_cross * alpha * beta * (2 * (Math.sqrt(ratio) - 1) - Math.log(ratio)));

            if (isNaN(crossSection)) continue;

            // Cross section 계산 후 변환 처리
            let crossSection_barns = crossSection / 1e-28;  // 처음엔 barn 단위로 계산
            let selectedUnit = document.getElementById('unit-select').value;

            // 선택된 단위에 따라 변환 처리
            if (selectedUnit === "angstrom2") {
                crossSection_barns *= 1e-8;  // 1 barn = 1e-8 Å²
            }

            // 값이 0 이하이면 null 처리
            crossSection_row.push(crossSection_barns > 0 ? crossSection_barns : null);
            E_threshold_row.push(E_threshold);  // y축 값은 E_threshold로 대체
        }

        crossSections.push(crossSection_row);
        Ee_values.push([...Array(crossSection_row.length).keys()].map(i => i * 1));  // x축은 Ee
        E_threshold_values.push(E_threshold_row);  // y축은 E_threshold
    }

    const data = [{
        x: Ee_values, y: E_threshold_values, z: crossSections,
        type: 'surface',
        contours: { x: { show: true, color: 'black', size: 10 }, y: { show: true, color: 'black', size: 0.1 } },
        colorscale: [[0, 'blue'], [0.5, 'green'], [1, 'red']],
        showscale: true
    }];

    const layout = {
        title: 'Knock-on Cross Section 3D Plot',
        scene: {
            xaxis: { title: 'Ee (keV)', range: [0, 300], dtick: 50 },
            yaxis: { title: 'E_threshold (eV)', range: [0.1, 100], dtick: 10 },  // y축은 E_threshold 범위
            zaxis: { title: `Cross Section (${selectedUnit === 'barn' ? 'barn' : 'Å²'})` }
        },
        width: 600, height: 600, autosize: false
    };

    Plotly.newPlot('3d-graph', data, layout, { responsive: true, useResizeHandler: true });

    // CSV 저장용 데이터 저장
    Ee_values_global = Ee_values;
    E_threshold_values_global = E_threshold_values;
    crossSections_global = crossSections;
}


// CSV 파일 생성 및 다운로드 함수
function downloadCSVFile() {
    const csvData = convertToCSV(Ee_values_global, E_threshold_values_global, crossSections_global);
    downloadCSV(csvData, 'cross_section_data.csv');
}

// 데이터를 CSV 형식으로 변환하는 함수
function convertToCSV(Ee_values, E_threshold_values, crossSections) {
    let csvRows = ['E_threshold(eV)'];
    for (let i = 0; i < E_threshold_values.length; i++) csvRows[0] += `,${Ee_values[i][0]}`;

    for (let j = 0; j <= 300; j++) {
        let row = [`${j}`];
        for (let i = 0; i < Ee_values.length; i++) {
            let crossSectionValue = crossSections[i] && crossSections[i][j - 1] !== undefined ? (isFinite(crossSections[i][j - 1]) ? crossSections[i][j - 1] : "Infinity") : "";
            row.push(crossSectionValue);
        }
        csvRows.push(row.join(','));
    }

    return csvRows.join("\n");
}

// CSV 다운로드를 위한 버튼 이벤트
function downloadCSV(csvData, filename) {
    const csvBlob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
}



// Ionization Cross Section 계산 함수
function calculateIonizationCrossSection() {
    // 입력값 가져오기
    const T_keV = parseFloat(document.getElementById('Ionization-T-value').value); // Incident Electron Energy in keV
    const B_eV = parseFloat(document.getElementById('B-value-1').value);  // Orbital Binding Energy in eV
    const U_eV = parseFloat(document.getElementById('U-value-1').value);  // Orbital Kinetic Energy in eV
    const selectedUnit = document.getElementById('unit-select-ionization').value; // 선택된 단위

    if (isNaN(T_keV) || isNaN(B_eV) || isNaN(U_eV)) {
        alert("Please enter valid numbers for T, B, and U.");
        return;
    }

    // T, B, U 변환
    const T_eV = T_keV * 1e3;  // T를 keV에서 eV로 변환
    const t = T_eV / B_eV;  // t 계산
    const t_prime = T_eV / mc2_eV;  // t' 계산
    const b_prime = B_eV / mc2_eV;  // b' 계산
    const u_prime = U_eV / mc2_eV;  // u' 계산

    // β² 값 계산
    const beta_t_squared = 1 - 1 / (1 + t_prime)**2;
    const beta_u_squared = 1 - 1 / (1 + u_prime)**2;
    const beta_b_squared = 1 - 1 / (1 + b_prime)**2;

    // Ionization cross section 계산
    let ionizationCrossSection = (4 * Math.PI * a0**2 * alpha**4 * N) / ((beta_t_squared + beta_u_squared + beta_b_squared) * 2 * b_prime);
    const part2 = 0.5 * (Math.log(beta_t_squared / (1 - beta_t_squared)) - beta_t_squared - Math.log(2 * b_prime)) * (1 - 1/t**2);
    const part3 = (1 - 1/t - Math.log(t) / (t + 1) * (1 + 2 * t_prime) / (1 + t_prime / 2)**2 + (b_prime**2) / (1 + t_prime / 2)**2 * (t - 1) / 2);

    ionizationCrossSection *= (part2 + part3);

    // 단위 변환
    let unitText;
    if (selectedUnit === "barn") {
        // m² -> barn 변환 (1 barn = 10^-28 m²)
        ionizationCrossSection /= 1e-28; // m²에서 barn으로 변환
        unitText = "barns";
    } else if (selectedUnit === "angstrom2") {
        // m² -> Å² 변환 (1 Å² = 10^-20 m²)
        ionizationCrossSection /= 1e-20; // m²에서 Å²로 변환
        unitText = "Å²";
    }

    // 결과를 HTML로 표시
    document.getElementById('ionization-cross-section-result').innerHTML = `σ<sub>rBEB</sub> (${T_keV} keV) : ${ionizationCrossSection.toExponential(2)} ${unitText}`;
}




let inputCounter = 1; // 동적 입력 필드 카운터


// 동적으로 입력 필드를 추가하는 함수
function addInputField() {
    inputCounter++;
    const container = document.getElementById('input-container');
    const newInputGroup = document.createElement('div');
    newInputGroup.className = 'input-group';
    newInputGroup.id = `input-group-${inputCounter}`; // ID 추가
    newInputGroup.innerHTML = `
        <label class="input-label" for="B-value-${inputCounter}">(${inputCounter}) Orbital Binding Energy (B) : </label>
        <input type="number" id="B-value-${inputCounter}" placeholder="Enter Binding energy (B) in eV">
        
        <label class="input-label" for="U-value-${inputCounter}">Orbital Kinetic Energy (U) : </label>
        <input type="number" id="U-value-${inputCounter}" placeholder="Enter Kinetic energy (U) in eV">
    `;
    container.appendChild(newInputGroup);
}

// 입력 필드를 제거하는 함수
function removeInputField() {
    if (inputCounter > 1) {
        const container = document.getElementById('input-container');
        const lastInputGroup = document.getElementById(`input-group-${inputCounter}`);
        container.removeChild(lastInputGroup);
        inputCounter--;
    }
}

// 모든 입력 필드를 제거하는 함수 (Clear All)
function clearAllInputFields() {
    const container = document.getElementById('input-container');
    
    // 기본 입력 필드 한 개를 남기고 나머지 제거
    while (inputCounter > 1) {
        const lastInputGroup = document.getElementById(`input-group-${inputCounter}`);
        container.removeChild(lastInputGroup);
        inputCounter--;
    }
}



// 여러 σrBEB 그래프를 그리는 함수 (기존 2D 그래프 기능을 여러 개로 확장)
function generateMultipleIonizationGraphs() {
    const B_values = [];
    const U_values = [];
    const selectedUnit = document.getElementById('unit-select-ionization').value; // 선택된 단위 가져오기
    
    
    // 각 입력 필드에서 B와 U 값을 추출
    for (let i = 1; i <= inputCounter; i++) {
        const B_value = parseFloat(document.getElementById(`B-value-${i}`).value);
        const U_value = parseFloat(document.getElementById(`U-value-${i}`).value);

        if (!isNaN(B_value) && !isNaN(U_value)) {
            B_values.push(B_value);
            U_values.push(U_value);
        }
    }

    if (B_values.length === 0 || U_values.length === 0) {
        alert("Please enter valid B and U values.");
        return;
    }

    // 여러 그래프를 그릴 데이터셋 생성
    const datasets = [];
    let totalCrossSections = Array(301).fill(0); // 총합을 저장할 배열 (0~300 keV 범위)

    for (let i = 0; i < B_values.length; i++) {
        const B_eV = B_values[i];
        const U_eV = U_values[i];
        const t_prime_values = [];
        const crossSections = [];

        // Incident Electron Energy (T) 값 범위 설정 (0 ~ 300 keV)
        for (let T_keV = 0; T_keV <= 300; T_keV += 1) {
            const T_eV = T_keV * 1e3; // T를 keV에서 eV로 변환
            const t = T_eV / B_eV;
            const t_prime = T_eV / mc2_eV;
            const b_prime = B_eV / mc2_eV;
            const u_prime = U_eV / mc2_eV;

            // β² 값 계산
            const beta_t_squared = 1 - 1 / (1 + t_prime) ** 2;
            const beta_u_squared = 1 - 1 / (1 + u_prime) ** 2;
            const beta_b_squared = 1 - 1 / (1 + b_prime) ** 2;

            // Ionization cross section 계산
            let ionizationCrossSection = (4 * Math.PI * a0**2 * alpha**4 * N) / ((beta_t_squared + beta_u_squared + beta_b_squared) * 2 * b_prime);
            const part2 = 0.5 * (Math.log(beta_t_squared / (1 - beta_t_squared)) - beta_t_squared - Math.log(2 * b_prime)) * (1 - 1/t**2);
            const part3 = (1 - 1/t - Math.log(t) / (t + 1) * (1 + 2 * t_prime) / (1 + t_prime / 2)**2 + (b_prime**2) / (1 + t_prime / 2)**2 * (t - 1) / 2);

            ionizationCrossSection *= (part2 + part3);

             // 선택한 단위에 따라 변환
             if (selectedUnit === 'barn') {
                // 미터 제곱(m²) -> barn 변환 (1 barn = 10^-28 m²)
                ionizationCrossSection /= 1e-28;
            } else if (selectedUnit === 'angstrom2') {
                // 미터 제곱(m²) -> Å² 변환 (1 Å² = 10^-20 m²)
                ionizationCrossSection /= 1e-20;
            }

            t_prime_values.push(T_keV);  // T를 x축 값으로 추가
            crossSections.push(ionizationCrossSection);  // 계산된 cross section을 y축 값으로 추가
            totalCrossSections[T_keV] += ionizationCrossSection; // 총합 계산
        }

        // 새로운 데이터셋 생성 (각 B, U 값에 대한 그래프)
        datasets.push({
            label: `σrBEB for B=${B_eV} eV, U=${U_eV} eV`,
            data: crossSections,
            borderColor: getRandomColor(),  // 그래프 색상 랜덤 선택
            borderWidth: 1,
            pointRadius: 2,
            fill: false
        });
    }

        // 총합 데이터셋 추가
        datasets.push({
            label: 'Total Ionization Cross Section',
            data: totalCrossSections,
            borderColor: 'black', // 총합은 검은색으로 표시
            borderWidth: 1,  // 더 두껍게
            fill: false,
            pointStyle: 'Circle',
            pointRadius: 4, // 포인트 크기 설정
            pointHoverRadius: 6,  // 마우스 hover 시 포인트 크기
            borderDash: [] // 총합 그래프는 점선으로 표시
        });

    // 기존에 그려진 그래프가 있으면 파괴 (삭제)
    if (ionizationChartInstance !== null) {
        ionizationChartInstance.destroy();
        ionizationChartInstance = null;
    }

    // y축 단위에 따른 라벨 변경
    const yLabel = selectedUnit === 'barn' ? 'Ionization Cross Section (barn)' : 'Ionization Cross Section (Å²)';

    // 2D 그래프 생성 (Chart.js 사용)
    const ctx = document.getElementById('Ionization-cross-section-graph').getContext('2d');
    ionizationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...Array(301).keys()],  // 0 ~ 300 keV까지 x축 값
            datasets: datasets  // 여러 데이터셋 추가
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Incident Electron Energy (keV)'
                    },
                    min: 0,
                    max: 300,
                    ticks: {
                        stepSize: 50
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel // 선택한 단위에 따른 y축 라벨
                    },
                    min: 0
                }
            }
        }
    });
}

// 랜덤 색상 생성 함수 (그래프의 각 데이터셋을 구분하기 위해)
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// CSV 파일 생성 및 다운로드 함수
function downloadCSVFileforIonizationcrosssection() {
    let csvContent = "\uFEFF"; // UTF-8 BOM 추가

    // 첫 번째 행에 Incident Electron Energy (T) 추가
    let csvRows = ['Incident Electron Energy (keV)'];

    // B, U 값 세트를 CSV 첫 번째 행에 추가 (B: value / U: value 형식)
    const selectedUnit = document.getElementById('unit-select-ionization').value; // 선택된 단위 가져오기
    const unitLabel = selectedUnit === 'barn' ? 'barns' : 'Å²'; // 단위에 따른 라벨 설정

    let totalInputCounter = inputCounter; // 실제 입력된 필드 개수를 기준으로 계산

    for (let i = 1; i <= totalInputCounter; i++) {
        // 해당 B-value와 U-value가 있는지 확인 후 가져오기
        const B_element = document.getElementById(`B-value-${i}`);
        const U_element = document.getElementById(`U-value-${i}`);

        // B, U 필드가 있을 때만 추가
        if (B_element && U_element) {
            const B_value = B_element.value || "N/A";
            const U_value = U_element.value || "N/A";
            csvRows.push(`(${i}) B: ${B_value} / U: ${U_value} (${unitLabel})`); // 번호와 단위 추가
        }
    }

    // Total Ionization Cross Section 열 추가
    csvRows.push(`Total Ionization Cross Section (${unitLabel})`);
    csvContent += csvRows.join(",") + "\n";

    // 각 Incident Electron Energy 값에 대해, 각 그래프의 값을 같은 행에 추가
    for (let i = 0; i < 301; i++) { // 0 ~ 300 keV 범위
        let row = [i];  // Incident Electron Energy (keV)
        let totalIonizationCrossSection = 0;

        // 각 그래프의 데이터를 해당 열에 추가
        ionizationChartInstance.data.datasets.slice(0, -1).forEach((dataset) => { // 마지막에 Total 열을 추가하지 않도록 수정
            const value = dataset.data[i] || 0; // 해당 그래프의 값 추가, 값이 없으면 0
            row.push(value);
            totalIonizationCrossSection += value; // 각 그래프의 값을 더하여 Total 구하기
        });

        row.push(totalIonizationCrossSection); // 총합 값을 마지막 열에 추가
        csvContent += row.join(",") + "\n";  // 각 값을 쉼표로 구분하고 행 끝에 줄바꿈 추가
    }

    // Blob 객체 생성
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
    // CSV 파일 다운로드를 위한 링크 생성 및 클릭
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "ionization_graphs_data.csv");
    document.body.appendChild(link);
    link.click();

    // 다운로드 후 링크 제거
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // 메모리에서 URL 해제
}
