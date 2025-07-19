// Flows will be imported for their side effects in this file.
// This is necessary for the server startup logic within the flow to run.
import './flows/notification-flow';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// In this version, genkit() is called within the flow file itself
// or by the framework. This file is just for dev-time discovery.
