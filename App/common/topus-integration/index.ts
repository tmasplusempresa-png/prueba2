import { transformToFormData } from "../utils/transformToFormData";
import {getTokenRequest} from "./getTokenRequest";
import {getUserData} from "./getUserData";
import { TOKEN_BUSSINESS } from "@/config/keys";
import { HISTORIC_USER_ID_PROCESS } from "@/constants/topus.constants";

export const getUserVerification = async (data) => {
    const dataRequest = {
        token : TOKEN_BUSSINESS,
        id_process : HISTORIC_USER_ID_PROCESS,
        ...data
    }
    const dataUser = transformToFormData(dataRequest);
    const responseToken = await getTokenRequest(dataUser);
    const resultResponseToken = await responseToken.json();
    if(isNaN(Number(resultResponseToken.result))){
        throw new Error('Ha ocurrido un error en la consulta, verifique los datos ingresados')
    }else {
        await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 2));
        const processRequest = {
            token : TOKEN_BUSSINESS,
            id_request : resultResponseToken?.result
        }
        const processData = transformToFormData(processRequest);
        const responseData = await getUserData(processData)
        const resultResponseData = await responseData.json();
        if (!Array.isArray(resultResponseData.result)) {
            throw new Error('Ha ocurrido un error en la consulta de los datos, intente nuevamente');
        }else{
            return resultResponseData.result;
        }
    }
}
