import axios from "axios";

const unstopOppertunities = async(page,pagination,roles,userType) =>{
    const response = await axios.get(`https://unstop.com/api/public/opportunity/search-result?opportunity=internships&page=${page}&per_page=${pagination}&roles=${roles}&usertype=${userType}&oppstatus=open&sortBy=&orderBy=&filter_condition=&undefined=true`);
    return response.data;
}

export default unstopOppertunities;