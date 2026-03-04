import { Injectable } from '@nestjs/common';
import { API_VERSIONS } from '../constants/api';

@Injectable()
export class AppService {
  getHello(): {
	message: string;
	docs: { version: string; url: string; openapi: string }[];
  } {
	return {
	  message: 'Welcome to the Recomend API!',
	  docs: API_VERSIONS.map((version) => ({
		version,
		url: `/${version}/api-docs`,
		openapi: `/${version}/api-json`,
	  })),
	};
  }
}
