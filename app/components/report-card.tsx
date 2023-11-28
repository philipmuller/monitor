import { ReportData } from '../model/report-data';
import { FDM, CNC, Soldering, Ventilation } from './icons';
import moment from 'moment';

export default function ReportCard({data, interactiveData}: {data: ReportData, interactiveData?: {confirmed?: boolean, submitAnswer: (answer: boolean) => void} }) {

    const stateBadge = () => {
        if (data.status === 'good') {
            return (
                <div className="bg-green-200 rounded-full text-green-800 text-[9px] px-2 py-0.5 font-mono uppercase tracking-widest">Good</div>
            )
        } else if (data.status === 'critical') {
            return (
                <div className="bg-red-200 rounded-full text-red-800 text-[9px] px-2 py-0.5 font-mono uppercase tracking-widest">Critical</div>
            )
        } else {
            return (
                <div className="bg-yellow-200 rounded-full text-yellow-800 text-[9px] px-2 py-0.5 font-mono uppercase tracking-widest">Warning</div>
            )
        }
    }

    const icon = () => {
        switch (data.machineType) {
            case 'FDM':
                return <FDM/>;
            case 'CNC':
                return <CNC/>
            case 'Soldering':
                return <Soldering/>;
            case 'Ventilation':
                return <Ventilation/>;
            default:
                return <div className='w-10 h-10 bg-stone-100'/>;
        }
    }

    const interactiveWidget = () => {
        console.log(JSON.stringify(interactiveData));
        if (interactiveData != undefined && interactiveData != null) {
            if (interactiveData.confirmed != undefined && interactiveData.confirmed != null) {
                return interactiveData.confirmed! ? (<p className="text-green-800">Confirmed!</p>) : (<p className="text-red-800">Rejected</p>);
            } else {
                return (
                    <div className="flex flex-row gap-3">
                        <button className="bg-green-200 text-green-800 w-32 flex-none rounded-2xl flex justify-center place-items-center p-2" onClick={() => {
                            interactiveData.submitAnswer(true);
                        }}>Confirm</button>
                        <button className="bg-red-200 text-red-800 w-32 flex-none rounded-2xl flex justify-center place-items-center" onClick={() => {
                            interactiveData.submitAnswer(false);
                        }}>Reject</button>
                    </div>
                )
            }
        }
    }

    const getDisplayDate = (date: string) => {
        console.log("Input Date String: "+date);
        var inputDate = moment.utc(date);
        console.log("Converted to Moment: "+JSON.stringify(inputDate));
        const finalString = inputDate.format('DD MMM YYYY HH:mm');
        console.log("Output String: "+finalString);
        return finalString;
    }

    return (
        <div className="flex rounded-2xl border w-full text-slate-800 gap-5 flex-col items-center justify-between p-5">
            <div className="flex w-full flex-row items-center justify-between">
                <div className="flex flex-col">
                    <h1 className='text-xl'>{data.machineName}</h1>
                    <h2 className='text-lg'>{getDisplayDate(data.date)}</h2>
                </div>
                {icon()}
            </div>
            <div className="flex flex-row gap-2 w-full items-center">
                <div className="bg-gray-200 h-0.5 w-full"/>
                    {stateBadge()}
                <div className="bg-gray-200 h-0.5 w-full"/>
            </div>
            <p>{data.remarks}</p>

            {interactiveWidget()}
        </div>
    );
}