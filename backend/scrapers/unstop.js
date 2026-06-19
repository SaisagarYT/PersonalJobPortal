import axios from "axios";

const unstopInternshipFetch = async(page,pagination,roles) =>{
    const response = await axios.get(`https://unstop.com/api/public/opportunity/search-result?opportunity=internships&page=${page}&per_page=${pagination}8&roles=${roles}`);
    return response.data;
}

export default unstopInternshipFetch;