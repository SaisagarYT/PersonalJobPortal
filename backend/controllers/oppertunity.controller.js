import unstopOppertunities from "../scrapers/unstop.js";
import {load} from 'cheerio';
const unstopFetchOppertunities = async(req,res) =>{
    const {page,pagination,role,userType} = req.body;

    page == undefined? page = 1 : page;
    pagination == undefined? pagination = 18 : pagination;
    role == ""? role = "ai-engineer" : role
    userType == ""? "students": userType
    console.log(page,pagination,role,userType);
    
    try{
        const internshipData = await unstopOppertunities(page,pagination,role,userType);
        console.log(internshipData);
        const jobs = internshipData.data.data.map((job) =>({
            externalId:job.id,
            title:job.title,
            shortUrl:job.short_url,
            company:{
                name:job.organisation.name,
                logo:job.organisation.logoUrl
            },
            description:load(job.details).text().trim(),
            status:job.status,
            work:job.workfunction.name,
            filters:{
                name:job.filters?.map(f => f.name)
            },
            skills:{
                skill:job.required_skills.map(rs => rs.skill),

            },
            location:job.locations.map((l => ({
                city:l.city,
                state:l.state,
                country:l.country
            }))),
            jobDetail:{
                max_salary:job.jobDetail.max_salary,
                currency:job.jobDetail.currency
            },
            type:job.jobDetail.type,
            timing:job.jobDetail.timing,
            paymentType:job.jobDetail.paid_unpaid,
            endDate:job.end_date,
            approvedDate:job.approved_date,
            registerCount:job.registerCount
        }));
        return res.status(200).json(jobs);
    }
    catch(err){
        return res.status(500).json({message:"Internal server error"});
    }
}

export default unstopFetchOppertunities;


