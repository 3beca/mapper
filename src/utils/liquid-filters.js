import { Liquid } from 'liquidjs';

export const registerFilters = () => {
    const engine = new Liquid();
    engine.registerFilter(
        'ms_date',
        (strDate) => (new Date(strDate)).getTime()
    );

    engine.registerFilter(
        'ns_date',
        (strDate) => (new Date(strDate)).getTime() * 1000000
    );

};
