export const useInferenceForm = () => {
  // LLM 폼 데이터
  const llmData = ref({
    prompt: "",
    max_tokens: 100,
    temperature: 0.7
  });

  // MLFlow 폼 데이터
  const formData = ref({
    name: "input",
    shape: [1, 4],
    datatype: "FP64",
    data: new Array(4).fill(0),
  });

  // JSON 입력
  const jsonInput = ref("");
  const jsonError = ref("");
  
  // 입력 방법
  const inputMethod = ref("json");

  // Computed
  const totalInputs = computed(() => {
    const shape0 = Number(formData.value.shape[0]) || 1;
    const shape1 = Number(formData.value.shape[1]) || 1;
    return shape0 * shape1;
  });

  const canSubmit = computed(() => {
    return (isMLFlow: boolean) => {
      if (!isMLFlow) {
        // LLM 모드인 경우
        return llmData.value.prompt.trim() !== "";
      } else if (inputMethod.value === "json") {
        return jsonInput.value.trim() && !jsonError.value;
      } else {
        return formData.value.data.some(
          (val) => val !== 0 && val !== "" && val !== null && val !== undefined
        );
      }
    };
  });

  // 메서드들
  const updateDataArray = () => {
    const newSize = totalInputs.value;
    const currentData = [...formData.value.data];

    if (newSize > currentData.length) {
      formData.value.data = [
        ...currentData,
        ...new Array(newSize - currentData.length).fill(0),
      ];
    } else {
      formData.value.data = currentData.slice(0, newSize);
    }
    syncFormToJson();
  };

  const syncFormToJson = () => {
    const data = {
      name: formData.value.name,
      shape: formData.value.shape,
      datatype: formData.value.datatype,
      data: formData.value.data.map((val) => Number(val) || 0),
    };
    jsonInput.value = JSON.stringify(data, null, 2);
    validateJson();
  };

  const validateJson = () => {
    if (!jsonInput.value.trim()) {
      jsonError.value = "";
      return;
    }
    try {
      JSON.parse(jsonInput.value);
      jsonError.value = "";
    } catch (e) {
      jsonError.value = "Invalid JSON format";
    }
  };

  const clearInput = (isMLFlow: boolean) => {
    if (!isMLFlow) {
      // LLM 모드인 경우
      llmData.value = {
        prompt: "",
        max_tokens: 100,
        temperature: 0.7
      };
    } else if (inputMethod.value === "json") {
      jsonInput.value = "";
      jsonError.value = "";
    } else {
      formData.value = {
        name: "input",
        shape: [1, 4],
        datatype: "FP64",
        data: new Array(4).fill(0),
      };
    }
  };

  const fillRandomData = () => {
    formData.value.data = new Array(totalInputs.value)
      .fill(0)
      .map(() => Math.floor(Math.random() * 1000000000));
    syncFormToJson();
  };

  const fillZeroData = () => {
    formData.value.data = new Array(totalInputs.value).fill(0);
    syncFormToJson();
  };

  const useTemplate = (template: string, inputExampleData: any) => {
    const size = totalInputs.value;
    switch (template) {
      case "example":
        if (inputExampleData && Array.isArray(inputExampleData) && inputExampleData.length > 0) {
          const firstArray = inputExampleData[0];
          let exampleData = [];
          
          if (Array.isArray(firstArray)) {
            exampleData = [...firstArray];
          } else {
            exampleData = [...inputExampleData];
          }
          
          if (size <= exampleData.length) {
            formData.value.data = exampleData.slice(0, size);
          } else {
            formData.value.data = [
              ...exampleData,
              ...new Array(size - exampleData.length).fill(0)
            ];
          }
        }
        break;
      case "zeros":
        formData.value.data = new Array(size).fill(0);
        break;
      case "ones":
        formData.value.data = new Array(size).fill(1);
        break;
    }
    syncFormToJson();
  };

  const setInputMethod = (method: string) => {
    inputMethod.value = method;
  };

  const loadFromHistory = (item: any, isMLFlow: boolean) => {
    if (item.data) {
      if (!isMLFlow && item.data.prompt) {
        // LLM 히스토리인 경우
        llmData.value = {
          prompt: item.data.prompt,
          max_tokens: item.data.max_tokens || 100,
          temperature: item.data.temperature || 0.7
        };
      } else if (typeof item.data === "object") {
        jsonInput.value = JSON.stringify(item.data, null, 2);
        inputMethod.value = "json";
      }
    }
  };

  return {
    // Data
    llmData,
    formData,
    jsonInput,
    jsonError,
    inputMethod,
    
    // Computed
    totalInputs,
    canSubmit,
    
    // Methods
    updateDataArray,
    syncFormToJson,
    validateJson,
    clearInput,
    fillRandomData,
    fillZeroData,
    useTemplate,
    setInputMethod,
    loadFromHistory
  };
};