import { Liquid } from 'liquidjs';
import { registerFilters } from '../src/utils/liquid-filters';

let liquidEngine;
const parseTemplate = async (source, template) => {
    if (!template) return undefined;
    return await liquidEngine.parseAndRender(template, source);
};

describe(
    'Liquid filters',
    () => {
        beforeAll(
            () => {
                registerFilters();
                liquidEngine = new Liquid();
            }
        );

        it(
            'should compile a date into milliseconds',
            async () => {
                const date = new Date();
                const tempelate = '{{timestamp | ms_date}}';
                const source = {timestamp: date.toISOString()};

                const parsed = await parseTemplate(source, tempelate);

                expect(parsed).toEqual('' + date.getTime());
            }
        );

        it(
            'should compile a date into nanoseconds',
            async () => {
                const date = new Date();
                const tempelate = '{{timestamp | ns_date}}';
                const source = {timestamp: date.toISOString()};

                const parsed = await parseTemplate(source, tempelate);

                expect(parsed).toEqual('' + date.getTime() * 1000000);
            }
        );
    }
);
